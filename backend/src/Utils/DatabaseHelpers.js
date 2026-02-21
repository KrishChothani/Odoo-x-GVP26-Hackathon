import mongoose from 'mongoose';
import {
  User,
  Farm,
  PracticeLog,
  CarbonCalculation,
  CarbonCredit,
  Transaction
} from '../Models/index.js';

/**
 * Database helper utilities for common operations
 */
export class DatabaseHelpers {
  
  /**
   * Get farmer's carbon footprint summary
   */
  static async getFarmerCarbonSummary(farmerId) {
    const pipeline = [
      {
        $match: { farmerId: new mongoose.Types.ObjectId(farmerId) }
      },
      {
        $lookup: {
          from: 'practice_logs',
          localField: '_id',
          foreignField: 'farmId',
          as: 'practiceLogs'
        }
      },
      {
        $lookup: {
          from: 'carbon_calculations',
          localField: 'practiceLogs._id',
          foreignField: 'practiceLogId',
          as: 'calculations'
        }
      },
      {
        $lookup: {
          from: 'carbon_credits',
          localField: '_id',
          foreignField: 'farmerId',
          as: 'credits'
        }
      },
      {
        $group: {
          _id: '$farmerId',
          totalFarms: { $sum: 1 },
          totalArea: { $sum: '$areaHectares' },
          totalPracticeLogs: { $sum: { $size: '$practiceLogs' } },
          totalCarbonSequestered: { 
            $sum: { 
              $sum: {
                $map: {
                  input: '$calculations',
                  as: 'calc',
                  in: '$$calc.netCarbon'
                }
              }
            }
          },
          totalCreditsIssued: {
            $sum: {
              $sum: {
                $map: {
                  input: '$credits',
                  as: 'credit',
                  in: '$$credit.creditsIssued'
                }
              }
            }
          }
        }
      }
    ];

    return await Farm.aggregate(pipeline);
  }

  /**
   * Get FPO dashboard statistics
   */
  static async getFPODashboard(fpoId) {
    const pipeline = [
      {
        $match: { fpoId: new mongoose.Types.ObjectId(fpoId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'farmerId',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      {
        $lookup: {
          from: 'carbon_credits',
          localField: 'farmerId',
          foreignField: 'farmerId',
          as: 'credits'
        }
      },
      {
        $lookup: {
          from: 'transactions',
          localField: 'credits._id',
          foreignField: 'creditId',
          as: 'transactions'
        }
      },
      {
        $group: {
          _id: '$fpoId',
          totalFarmers: { $addToSet: '$farmerId' },
          totalFarms: { $sum: 1 },
          totalArea: { $sum: '$areaHectares' },
          totalCredits: {
            $sum: {
              $sum: {
                $map: {
                  input: '$credits',
                  as: 'credit',
                  in: '$$credit.creditsIssued'
                }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: { 
                    $cond: [
                      { $eq: ['$$txn.paymentStatus', 'SUCCESS'] },
                      '$$txn.netAmount',
                      0
                    ]
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          totalFarmers: { $size: '$totalFarmers' },
          totalFarms: 1,
          totalArea: 1,
          totalCredits: 1,
          totalRevenue: 1
        }
      }
    ];

    return await Farm.aggregate(pipeline);
  }

  /**
   * Get carbon credits by vintage year and status
   */
  static async getCreditsByVintageAndStatus() {
    const pipeline = [
      {
        $group: {
          _id: {
            vintageYear: '$vintageYear',
            status: '$status'
          },
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditsIssued' }
        }
      },
      {
        $group: {
          _id: '$_id.vintageYear',
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalCredits: '$totalCredits'
            }
          },
          totalCount: { $sum: '$count' },
          totalCredits: { $sum: '$totalCredits' }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ];

    return await CarbonCredit.aggregate(pipeline);
  }

  /**
   * Get practice adoption rates
   */
  static async getPracticeAdoptionRates() {
    const pipeline = [
      {
        $lookup: {
          from: 'practices',
          localField: 'practiceId',
          foreignField: '_id',
          as: 'practice'
        }
      },
      {
        $unwind: '$practice'
      },
      {
        $group: {
          _id: {
            practiceId: '$practiceId',
            practiceName: '$practice.name'
          },
          totalLogs: { $sum: 1 },
          uniqueFarms: { $addToSet: '$farmId' },
          totalQuantity: { $sum: '$inputs.quantity' },
          avgQuantity: { $avg: '$inputs.quantity' }
        }
      },
      {
        $project: {
          _id: 1,
          totalLogs: 1,
          uniqueFarms: { $size: '$uniqueFarms' },
          totalQuantity: 1,
          avgQuantity: { $round: ['$avgQuantity', 2] }
        }
      },
      {
        $sort: { totalLogs: -1 }
      }
    ];

    return await PracticeLog.aggregate(pipeline);
  }

  /**
   * Get monthly carbon sequestration trends
   */
  static async getMonthlyCarbonTrends(year = new Date().getFullYear()) {
    const pipeline = [
      {
        $match: {
          calculatedAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$calculatedAt' },
            month: { $month: '$calculatedAt' }
          },
          totalNetCarbon: { $sum: '$netCarbon' },
          totalBaselineEmission: { $sum: '$baselineEmission' },
          totalReducedEmission: { $sum: '$reducedEmission' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ];

    return await CarbonCalculation.aggregate(pipeline);
  }

  /**
   * Get farms within a geographic radius
   */
  static async getFarmsNearLocation(longitude, latitude, radiusInKm = 10) {
    return await Farm.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInKm * 1000 // Convert km to meters
        }
      }
    }).populate('farmerId', 'name phone email')
      .populate('fpoId', 'name region');
  }

  /**
   * Get transaction summary for a time period
   */
  static async getTransactionSummary(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          paidAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          paymentStatus: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: {
            currency: '$currency'
          },
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalNetAmount: { $sum: '$netAmount' },
          totalCreditsTraded: { $sum: '$creditsQuantity' },
          avgPricePerCredit: { $avg: '$pricePerCredit' }
        }
      },
      {
        $project: {
          _id: 1,
          totalTransactions: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          totalNetAmount: { $round: ['$totalNetAmount', 2] },
          totalCreditsTraded: 1,
          avgPricePerCredit: { $round: ['$avgPricePerCredit', 2] }
        }
      }
    ];

    return await Transaction.aggregate(pipeline);
  }
}