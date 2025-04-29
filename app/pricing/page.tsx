import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/auth/register',
    price: { monthly: '$0', annually: '$0' },
    description: 'Perfect for trying out ZappForm.',
    features: [
      'Basic form detection',
      'Store up to 5 personal information fields',
      'Fill up to 20 forms per month',
      'Basic document parsing',
      'Single device support',
    ],
    buttonText: 'Get started for free',
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/auth/register?plan=pro',
    price: { monthly: '$12', annually: '$120' },
    description: 'Perfect for power users who need to fill many forms.',
    features: [
      'Advanced AI form detection',
      'Unlimited personal information fields',
      'Unlimited form filling',
      'Advanced document parsing',
      'Multiple device sync',
      'Custom templates for specific websites',
      'Form history and analytics',
      'Priority support',
    ],
    buttonText: 'Start your free trial',
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact-sales',
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For organizations that need additional security and support.',
    features: [
      'All Pro features',
      'SSO integration',
      'Dedicated account manager',
      'Advanced security controls',
      'User management dashboard',
      'Audit logs',
      'Custom API integrations',
      'SLA guarantees',
      '24/7 phone and email support',
    ],
    buttonText: 'Contact sales',
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white sm:text-center">Pricing Plans</h1>
          <p className="mt-5 text-xl text-gray-500 dark:text-gray-400 sm:text-center">
            Start filling forms faster with ZappForm. Choose the plan that works best for you.
          </p>
          <div className="relative mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex self-center">
            <button
              type="button"
              className="relative w-1/2 bg-white dark:bg-blue-600 border-gray-200 rounded-md py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 sm:w-auto sm:px-8"
            >
              Monthly billing
            </button>
            <button
              type="button"
              className="relative w-1/2 border border-transparent rounded-md py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 sm:w-auto sm:px-8"
            >
              Annual billing (10% off)
            </button>
          </div>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular
                  ? 'border-2 border-blue-500 dark:border-blue-400'
                  : 'border border-gray-200 dark:border-gray-700',
                'rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 flex flex-col'
              )}
            >
              <div className="p-6">
                <h2 className="text-2xl font-medium text-gray-900 dark:text-white">{tier.name}</h2>
                <p className="mt-4 text-gray-500 dark:text-gray-400">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tier.price.monthly}</span>{' '}
                  <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
                </p>
                {tier.mostPopular && (
                  <p className="mt-4 text-sm">
                    <Link href="#" className="text-blue-500 font-medium">
                      Annual billing also available
                    </Link>
                  </p>
                )}
                <Link
                  href={tier.href}
                  className={classNames(
                    tier.mostPopular
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800',
                    'mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium'
                  )}
                >
                  {tier.buttonText}
                </Link>
                
                {tier.mostPopular && (
                  <p className="mt-4 bg-blue-50 dark:bg-blue-900 px-3 py-2 text-sm leading-5 font-medium text-blue-700 dark:text-blue-200 rounded-lg">
                    Most popular choice
                  </p>
                )}
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">What's included</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-gray-500 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
        <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200 dark:divide-gray-700">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6 divide-y divide-gray-200 dark:divide-gray-700">
            <div className="pt-6">
              <dt className="text-lg">
                <span className="font-medium text-gray-900 dark:text-white">How does ZappForm protect my privacy?</span>
              </dt>
              <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                ZappForm processes all your information locally on your device. Your personal data is encrypted and never sent to our servers unless you explicitly choose to sync across devices, in which case we use end-to-end encryption.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg">
                <span className="font-medium text-gray-900 dark:text-white">Can I try ZappForm before purchasing?</span>
              </dt>
              <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Yes! Our Free tier allows you to use basic ZappForm features with some limits. All paid plans also come with a 14-day free trial, no credit card required.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg">
                <span className="font-medium text-gray-900 dark:text-white">How accurate is the AI form detection?</span>
              </dt>
              <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Our AI has been trained on millions of forms and achieves over 98% accuracy in detecting and filling standard form fields. The system continuously improves as it learns from usage patterns.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg">
                <span className="font-medium text-gray-900 dark:text-white">Can I cancel my subscription at any time?</span>
              </dt>
              <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access to your paid features until the end of your billing cycle.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-lg">
                <span className="font-medium text-gray-900 dark:text-white">Do you offer discounts for non-profits or educational institutions?</span>
              </dt>
              <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Yes, we offer special pricing for non-profits, educational institutions, and student users. Please contact our sales team for more information.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 