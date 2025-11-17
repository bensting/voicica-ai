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
 * 显示创作流程的步骤进度
 */
export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-4 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 lg:gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle and Label */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              {/* Circle */}
              <div
                className={`
                  w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${
                    index === currentStep
                      ? 'bg-blue-600 border-2 border-blue-600'
                      : index < currentStep
                      ? 'bg-blue-600 border-2 border-blue-600'
                      : 'bg-white border-2 border-gray-300'
                  }
                `}
              >
                {index < currentStep ? (
                  // Completed - Show checkmark
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  // Current or Future - Show dot
                  <div
                    className={`
                      w-2 h-2 lg:w-3 lg:h-3 rounded-full
                      ${index === currentStep ? 'bg-white' : 'bg-gray-300'}
                    `}
                  />
                )}
              </div>

              {/* Label - hidden on mobile for space */}
              <span
                className={`
                  hidden lg:inline-block text-sm font-medium transition-colors
                  ${
                    index === currentStep
                      ? 'text-blue-600'
                      : index < currentStep
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-8 lg:w-12 h-0.5 mx-1 lg:mx-2 transition-colors
                  ${index < currentStep ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Show current step label below */}
      <div className="lg:hidden text-center mt-3">
        <span className="text-sm font-medium text-blue-600">{steps[currentStep].label}</span>
      </div>
    </div>
  );
}