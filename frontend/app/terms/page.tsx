'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()} 
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using OpenFashion ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                OpenFashion is an AI-powered fashion analysis platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>AI image analysis for clothing items</li>
                <li>Reverse image search capabilities</li>
                <li>Style recommendations and chatbot assistance</li>
                <li>Wardrobe organization tools</li>
                <li>Shopping integration features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscription and Payments</h2>
              <p className="text-gray-700 mb-4">
                <strong>Free Tier:</strong> Basic features with limited uploads per week.<br/>
                <strong>Premium Tier:</strong> Unlimited features for a monthly subscription fee.
              </p>
              <p className="text-gray-700 mb-4">
                All payments are processed securely through Stripe. Subscription fees are billed monthly and are non-refundable except as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Content</h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of images you upload. By uploading content, you grant us a license to process and analyze your images for the purpose of providing our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Upload inappropriate or illegal content</li>
                <li>Attempt to reverse engineer our AI systems</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our <Link href="/privacy" className="text-meta-pink hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of AI analysis results or shopping recommendations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                OpenFashion shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us at:{' '}
                <a href="mailto:openfashion.dev@gmail.com" className="text-meta-pink hover:underline">
                  openfashion.dev@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 