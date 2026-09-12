import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'

interface CalculatorValues {
  monthlyLeads: number
  responseTime: number
  timeUnit: 'minutes' | 'hours' | 'days'
  closeRate: number
  jobValue: number
}

interface Results {
  lostLeads: number
  lostLeadsPercentage: number
  lostMonthlyRevenue: number
  lostAnnualRevenue: number
  currentCloseRate: number
  idealCloseRate: number
}

const RevenueCalculator: React.FC = () => {
  const [values, setValues] = useState<CalculatorValues>({
    monthlyLeads: 120,
    responseTime: 5,
    timeUnit: 'hours',
    closeRate: 20,
    jobValue: 500,
  })

  // Convert time to hours for calculation
  const getResponseTimeInHours = (): number => {
    switch (values.timeUnit) {
      case 'minutes':
        return values.responseTime / 60
      case 'hours':
        return values.responseTime
      case 'days':
        return values.responseTime * 24
      default:
        return values.responseTime
    }
  }

  // Conversion retention curve: exponential decay from 1.0 at 5 min to ~0.17 at 24 hours
  const getConversionRetention = (responseTimeHours: number): number => {
    if (responseTimeHours <= 0.083) return 1.0 // 5 minutes in hours
    const decayRate = 0.15
    const retention = Math.max(1 / 6, Math.exp(-decayRate * responseTimeHours))
    return retention
  }

  const results = useMemo<Results | null>(() => {
    if (
      values.monthlyLeads <= 0 ||
      values.responseTime <= 0 ||
      values.closeRate <= 0 ||
      values.jobValue <= 0
    ) {
      return null
    }

    const responseTimeHours = getResponseTimeInHours()
    const currentRetention = getConversionRetention(responseTimeHours)
    const idealRetention = 1.0

    const currentCloseRateDecimal = values.closeRate / 100
    const idealCloseRateDecimal = Math.min(
      0.95,
      currentCloseRateDecimal / currentRetention
    )

    const lostLeads = Math.round(
      values.monthlyLeads *
        (idealCloseRateDecimal - currentCloseRateDecimal)
    )

    const lostLeadsPercentage = Math.round(
      ((idealCloseRateDecimal - currentCloseRateDecimal) / idealCloseRateDecimal) *
        100
    )

    const currentMonthlyRevenue = Math.round(
      values.monthlyLeads * currentCloseRateDecimal * values.jobValue
    )
    const idealMonthlyRevenue = Math.round(
      values.monthlyLeads * idealCloseRateDecimal * values.jobValue
    )
    const lostMonthlyRevenue = idealMonthlyRevenue - currentMonthlyRevenue
    const lostAnnualRevenue = lostMonthlyRevenue * 12

    return {
      lostLeads,
      lostLeadsPercentage,
      lostMonthlyRevenue,
      lostAnnualRevenue,
      currentCloseRate: values.closeRate,
      idealCloseRate: Math.round(idealCloseRateDecimal * 100),
    }
  }, [values])

  const isAlreadyFast =
    values.responseTime > 0 &&
    getResponseTimeInHours() <= 0.083

  const handleChange = (
    field: keyof CalculatorValues,
    value: string | number
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const incrementValue = (field: keyof CalculatorValues, step: number = 1) => {
    if (field === 'timeUnit') return
    const currentValue = values[field] as number
    setValues((prev) => ({
      ...prev,
      [field]: Math.max(1, currentValue + step),
    }))
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
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
              Revenue Calculator
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Let's see how much money you're losing.
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Speed-to-lead is the single biggest lever in service-business revenue.
            Fill in four numbers and we'll estimate what slow responses are costing
            you.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-12 mb-12"
        >
          {/* Monthly Leads */}
          <div>
            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
              Monthly leads
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={values.monthlyLeads}
                onChange={(e) =>
                  handleChange('monthlyLeads', parseInt(e.target.value) || 0)
                }
                className="text-4xl font-bold focus:outline-none border-b-2 border-black pb-2 flex-1"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => incrementValue('monthlyLeads', 10)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => incrementValue('monthlyLeads', -10)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How many inbound leads do you get per month?
            </p>
          </div>

          {/* Response Time with Unit Toggle */}
          <div>
            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
              Avg. response time
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={values.responseTime}
                  onChange={(e) =>
                    handleChange('responseTime', parseInt(e.target.value) || 0)
                  }
                  className="text-4xl font-bold focus:outline-none border-b-2 border-black pb-2 flex-1"
                />
                <select
                  value={values.timeUnit}
                  onChange={(e) =>
                    handleChange('timeUnit', e.target.value as 'minutes' | 'hours' | 'days')
                  }
                  className="text-lg font-semibold focus:outline-none bg-white cursor-pointer px-2"
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => incrementValue('responseTime', 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => incrementValue('responseTime', -1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How long until a lead hears back from you, on average?
            </p>
          </div>

          {/* Close Rate */}
          <div>
            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
              Close rate
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={values.closeRate}
                  onChange={(e) =>
                    handleChange('closeRate', parseInt(e.target.value) || 0)
                  }
                  className="text-4xl font-bold focus:outline-none border-b-2 border-black pb-2 flex-1"
                />
                <span className="text-2xl font-semibold">%</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => incrementValue('closeRate', 5)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => incrementValue('closeRate', -5)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              What % of your leads turn into paying jobs?
            </p>
          </div>

          {/* Job Value */}
          <div>
            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
              Average job value
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-2xl font-semibold">$</span>
                <input
                  type="number"
                  value={values.jobValue}
                  onChange={(e) =>
                    handleChange('jobValue', parseInt(e.target.value) || 0)
                  }
                  className="text-4xl font-bold focus:outline-none border-b-2 border-black pb-2 flex-1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => incrementValue('jobValue', 100)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => incrementValue('jobValue', -100)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              What's the average value of a closed job?
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && !isAlreadyFast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="bg-black text-white p-10 rounded-lg space-y-6 mb-8"
            >
              {/* Main Result */}
              <div>
                <p className="text-gray-400 text-sm mb-2">YOUR ESTIMATED LOSS</p>
                <h2 className="text-5xl font-bold leading-tight mb-2">
                  You are losing about{' '}
                  <span className="underline">{results.lostLeadsPercentage}%</span> of
                  your leads
                </h2>
                <p className="text-3xl font-bold text-gray-100">
                  That's costing you{' '}
                  <span className="underline">
                    ${results.lostMonthlyRevenue.toLocaleString()}
                  </span>{' '}
                  a month.
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Lost leads/month
                  </p>
                  <p className="text-3xl font-bold">{results.lostLeads}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Lost per year
                  </p>
                  <p className="text-3xl font-bold">
                    ${results.lostAnnualRevenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Citation */}
              <p className="text-xs text-gray-500 pt-2">
                Based on MIT and InsideSales lead-response time studies.
              </p>
            </motion.div>
          )}

          {results && isAlreadyFast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="bg-black text-white p-10 rounded-lg space-y-4 mb-8"
            >
              <h2 className="text-4xl font-bold">
                You're capturing nearly every lead.
              </h2>
              <p className="text-lg text-gray-300">
                With your current response time, you're already operating at peak
                efficiency. Keep this up and you'll stay ahead of the competition.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {results && !isAlreadyFast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center space-y-6"
          >
            <p className="text-gray-600 text-sm">
              Ready to reclaim this lost revenue? Let's talk about how Pronto AI can
              help you respond to leads faster.
            </p>
            <a
              href="https://calendly.com/pronto-ai/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Book a call with Pronto AI
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default RevenueCalculator
