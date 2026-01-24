import { useState } from 'react'
import { useKV } from '@github/spark/hooks'

interface IntakeForm {
  demographics: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    phone: string
    email: string
    address: string
  }
  insurance: {
    provider: string
    policyNumber: string
    groupNumber: string
  }
  medicalHistory: {
    allergies: string[]
    medications: string[]
    conditions: string[]
  }
  chiefComplaint: string
}

export function PatientIntake() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useKV<Partial<IntakeForm>>('intake-form', {})

  const steps = [
    { number: 1, title: 'Demographics', icon: 'person' },
    { number: 2, title: 'Insurance', icon: 'verified_user' },
    { number: 3, title: 'Medical History', icon: 'medical_information' },
    { number: 4, title: 'Chief Complaint', icon: 'description' }
  ]

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
            Patient Intake
          </h1>
          <p className="text-text-secondary text-base">
            Complete patient information before visit
          </p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step.number
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40'
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-surface-dark-lighter text-text-secondary'
                }`}>
                  {currentStep > step.number ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    <span className="material-symbols-outlined">{step.icon}</span>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-bold ${currentStep >= step.number ? 'text-white' : 'text-text-secondary'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-surface-dark-lighter'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface-dark rounded-xl border border-border p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-white text-2xl font-bold mb-6">Demographics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Gender *
                  </label>
                  <select className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="patient@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Address *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Enter full address"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-white text-2xl font-bold mb-6">Insurance Information</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Insurance Provider *
                  </label>
                  <select className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="">Select provider</option>
                    <option value="bupa">Bupa Arabia</option>
                    <option value="tawuniya">Tawuniya</option>
                    <option value="medgulf">Medgulf</option>
                    <option value="salama">Salama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Enter policy number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Group Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Enter group number (if applicable)"
                  />
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex gap-3">
                <span className="material-symbols-outlined text-primary text-[24px] shrink-0">info</span>
                <div>
                  <p className="text-primary font-bold text-sm mb-1">Insurance Verification</p>
                  <p className="text-primary text-sm">
                    We'll verify your insurance coverage during check-in. Please have your insurance card ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-white text-2xl font-bold mb-6">Medical History</h2>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Known Allergies
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  placeholder="List any known allergies (medications, food, environmental)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Current Medications
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  placeholder="List all current medications, including dosage"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Medical Conditions
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  placeholder="List any chronic conditions or past medical history"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-white text-2xl font-bold mb-6">Chief Complaint</h2>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  What brings you in today? *
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Please describe your symptoms, concerns, or reason for visit in detail"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    When did symptoms start?
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g., 3 days ago"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Severity (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 bg-surface-dark-lighter border border-border rounded-lg text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Rate severity"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-surface-dark-lighter hover:bg-muted text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center gap-2"
              >
                Next
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            ) : (
              <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Submit Intake
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
