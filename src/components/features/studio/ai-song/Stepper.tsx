'use client';

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

/**
 * Stepper Component for AI Song Creation
 *
 * 显示创作流程的步骤进度 - Enhanced visual design
 */
export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full bg-gradient-to-r from-pink-50 via-white to-fuchsia-50 border-b border-gray-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Desktop: Horizontal Stepper */}
        <div className="hidden lg:flex items-center justify-between relative">
          {/* Background Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
          <div
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              zIndex: 0
            }}
          />

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-3 relative" style={{ zIndex: 1 }}>
                {/* Circle with number */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 font-semibold text-base
                    ${
                      isCurrent
                        ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/50 scale-110'
                        : isCompleted
                        ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-md'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    // Completed - Show checkmark with animation
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    // Show step number
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`
                      text-sm font-semibold transition-colors whitespace-nowrap
                      ${
                        isCurrent
                          ? 'text-pink-600'
                          : isCompleted
                          ? 'text-pink-500'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-pink-600 animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Compact Stepper with Progress Bar */}
        <div className="lg:hidden space-y-4">
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-500 rounded-full"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white flex items-center justify-center font-semibold shadow-lg shadow-pink-500/30">
                {currentStep + 1}
              </div>
              <div>
                <div className="text-xs text-gray-500">步骤 {currentStep + 1} / {steps.length}</div>
                <div className="text-base font-semibold text-pink-600">{steps[currentStep].label}</div>
              </div>
            </div>

            {/* Mini step indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${
                      index === currentStep
                        ? 'w-6 bg-pink-600'
                        : index < currentStep
                        ? 'bg-pink-500'
                        : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}