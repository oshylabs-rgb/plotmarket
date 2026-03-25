'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Building2, Search, MessageSquare, CreditCard, UserCircle, Plus, Sparkles } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to Plotmarket!',
    description: 'Let us show you around your dashboard. This quick tour will help you get started with listing and managing your properties.',
    icon: Sparkles,
    target: null,
  },
  {
    title: 'Your Dashboard Overview',
    description: 'Here you can see your key statistics at a glance — your total listings, inquiries received, subscription status, and active listings.',
    icon: Building2,
    target: 'tour-stats',
  },
  {
    title: 'Your Property Listings',
    description: 'This section shows your recent listings. You can view their status (pending, approved, rejected) and manage them from the My Listings page.',
    icon: Search,
    target: 'tour-listings',
  },
  {
    title: 'Inquiries from Buyers',
    description: 'When someone is interested in your property, their inquiry appears here. You can respond and manage all conversations from the Inquiries page.',
    icon: MessageSquare,
    target: 'tour-inquiries',
  },
  {
    title: 'Quick Actions',
    description: 'Use these shortcuts to add a new property, upgrade your subscription plan, or edit your profile.',
    icon: Plus,
    target: 'tour-actions',
  },
  {
    title: 'Add Your First Property',
    description: 'Ready to get started? Click "Add New Property" to create your first listing. Fill in the details — title, description, price, location, and property features — and submit it for review.',
    icon: Building2,
    target: null,
  },
]

export function OnboardingTour() {
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen the tour
    const tourCompleted = localStorage.getItem('plotmarket_tour_completed')
    if (!tourCompleted) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setShowTour(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const completeTour = () => {
    localStorage.setItem('plotmarket_tour_completed', 'true')
    setShowTour(false)
    setCurrentStep(0)
  }

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      // Scroll to target if exists
      const nextTarget = TOUR_STEPS[currentStep + 1].target
      if (nextTarget) {
        const el = document.getElementById(nextTarget)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      const prevTarget = TOUR_STEPS[currentStep - 1].target
      if (prevTarget) {
        const el = document.getElementById(prevTarget)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }

  if (!showTour) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={completeTour} />

      {/* Tour Card */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="rounded-2xl border border-brand-cream-300 bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green-50">
              <Icon className="h-5 w-5 text-brand-green-600" />
            </div>
            <button
              onClick={completeTour}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <h3 className="mt-4 text-lg font-bold text-gray-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>

          {/* Progress */}
          <div className="mt-4 flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-brand-green-500' : 'bg-brand-cream-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {currentStep + 1} of {TOUR_STEPS.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex items-center gap-1 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-700"
              >
                {isLastStep ? (
                  <>Get Started</>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <button
              onClick={completeTour}
              className="mt-3 block w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </>
  )
}
