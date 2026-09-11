import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'

interface CalculatorValues {
  monthlyLeads: number
  responseTime: number
  closeRate: number
  jobValue: number
}

interface Results {
  lostLeads: number
  lostMonthlyRevenue: number
  lostAnnualRevenue: number
  currentCloseRate: number
  idealCloseRate: number
  currentMonthlyRevenue: number
  idealMonthlyRevenue: number
  currentClosedJobs: number
  idealClosedJobs: number
}

const RevenueCalculator: React.FC = () => {
  const [values, setValues] = useState<CalculatorValues>({
    monthlyLeads: 0,
    responseTime: 0,
    closeRate: 0,
    jobValue: 0,
  })

  // Conversion retention curve: exponential decay from 1.0 at 5 min to ~0.17 at 24 hours
  const getConversionRetention = (responseTimeHours: number): number => {
    if (responseTimeHours <= 0) return 1.0
    // Exponential decay model
    const decayRate = 0.15 // Controls how fast it decays
    const retention = Math.max(1 / 6, Math.exp(-decayRate * responseTimeHours))
    return retention
  }

  const results = useMemo<Results | null>(() => {
    if (
      values.monthlyLeads <= 0 ||
      values.responseTime < 0 ||
      values.closeRate <= 0 ||
      values.jobValue <= 0
    ) {
      return null
    }

    const currentRetention = getConversionRetention(values.responseTime)
    const idealRetention = 1.0 // 5-minute response

    // Current close rate as decimal
    const currentCloseRateDecimal = values.closeRate / 100

    // Ideal close rate: current rate divided by retention, capped at 95%
    const idealCloseRateDecimal = Math.min(
      0.95,
      currentCloseRateDecimal / currentRetention
    )

    // Lost conversions
    const lostLeads = Math.round(
      values.monthlyLeads *
        (idealCloseRateDecimal - currentCloseRateDecimal)
    )

    // Revenue calculations
    const currentMonthlyRevenue = Math.round(
      values.monthlyLeads * currentCloseRateDecimal * values.jobValue
    )
    const idealMonthlyRevenue = Math.round(
      values.monthlyLeads * idealCloseRateDecimal * values.jobValue
    )
    const lostMonthlyRevenue = idealMonthlyRevenue - currentMonthlyRevenue
    const lostAnnualRevenue = lostMonthlyRevenue * 12

    // Closed jobs
    const currentClosedJobs = Math.round(
      values.monthlyLeads * currentCloseRateDecimal
    )
    const idealClosedJobs = Math.round(
      values.monthlyLeads * idealCloseRateDecimal
    )

    return {
      lostLeads,
      lostMonthlyRevenue,
      lostAnnualRevenue,
      currentCloseRate: values.closeRate,
      idealCloseRate: Math.round(idealCloseRateDecimal * 100),
      currentMonthlyRevenue,
      idealMonthlyRevenue,
      currentClosedJobs,
      idealClosedJobs,
    }
  }, [values])

  const isAlreadyFast = values.responseTime > 0 && values.responseTime <= 5

  const handleChange = (field: keyof CalculatorValues, value: number) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-widest uppercase">
              Pronto AI Revenue Calculator
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Let's see how much money you're losing.
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Speed-to-lead is the biggest revenue lever for service businesses.
            Leads contacted within 5 minutes are 21x more likely to qualify than
            those contacted after 30+ minutes.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 mb-12"
        >
          {/* Monthly Leads */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Monthly leads
            </label>
            <input
              type="number"
              placeholder="0"
              value={values.monthlyLeads || ''}
              onChange={(e) =>
                handleChange('monthlyLeads', parseInt(e.target.value) || 0)
              }
              className="w-full text-3xl font-bold focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              How many qualified leads do you get per month?
            </p>
          </div>

          {/* Response Time */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Average response time
            </label>
            <div className="flex items-baseline gap-3">
              <input
                type="number"
                placeholder="0"
                value={values.responseTime || ''}
                onChange={(e) =>
                  handleChange('responseTime', parseInt(e.target.value) || 0)
                }
                className="text-3xl font-bold focus:outline-none flex-1"
              />
              <span className="text-3xl font-bold">hours</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How long does it currently take you to respond to leads?
            </p>
          </div>

          {/* Close Rate */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Close rate
            </label>
            <div className="flex items-baseline gap-3">
              <input
                type="number"
                placeholder="0"
                value={values.closeRate || ''}
                onChange={(e) =>
                  handleChange('closeRate', parseInt(e.target.value) || 0)
                }
                className="text-3xl font-bold focus:outline-none flex-1"
              />
              <span className="text-3xl font-bold">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              What percentage of leads do you currently close?
            </p>
          </div>

          {/* Job Value */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Average job value
            </label>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">$</span>
              <input
                type="number"
                placeholder="0"
                value={values.jobValue || ''}
                onChange={(e) =>
                  handleChange('jobValue', parseInt(e.target.value) || 0)
                }
                className="text-3xl font-bold focus:outline-none flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              What's the average value of a closed job?
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="bg-black text-white p-8 md:p-10 rounded-lg space-y-8"
            >
              {/* Main Headline */}
              {!isAlreadyFast ? (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                      You're losing about{' '}
                      <span className="underline">
                        {results.lostLeads.toLocaleString()}
                      </span>{' '}
                      leads a month — roughly{' '}
                      <span className="underline">
                        ${results.lostMonthlyRevenue.toLocaleString()}
                      </span>{' '}
                      in missed revenue.
                    </h2>
                  </motion.div>

                  {/* Explanation */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-300 leading-relaxed"
                  >
                    A 5-minute response could lift your close rate from{' '}
                    <strong>{results.currentCloseRate}%</strong> to{' '}
                    <strong>{results.idealCloseRate}%</strong>. That's{' '}
                    <strong>${results.lostAnnualRevenue.toLocaleString()}</strong>{' '}
                    per year walking out the door.
                  </motion.p>

                  {/* Comparison */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-700"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                        Now (monthly)
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-400">Revenue</p>
                          <p className="text-2xl font-bold">
                            ${results.currentMonthlyRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Closed jobs</p>
                          <p className="text-2xl font-bold">
                            {results.currentClosedJobs}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                        With 5-min response
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-400">Revenue</p>
                          <p className="text-2xl font-bold">
                            ${results.idealMonthlyRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Closed jobs</p>
                          <p className="text-2xl font-bold">
                            {results.idealClosedJobs}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Citation */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-gray-500 pt-2"
                  >
                    Based on MIT and InsideSales lead-response time studies.
                  </motion.p>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    You're capturing nearly every lead.
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    With a {values.responseTime}-minute response time, you're already
                    operating at peak efficiency. Keep this up and you'll stay
                    ahead of the competition.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 space-y-4"
        >
          <p className="text-sm text-gray-600">
            Ready to reclaim your lost revenue? Pronto AI automates lead
            qualification and response to keep your pipeline moving.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-black font-semibold hover:gap-3 transition-all"
          >
            See how to fix this <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default RevenueCalculator
