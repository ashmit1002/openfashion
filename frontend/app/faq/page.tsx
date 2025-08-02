import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Get answers to common questions about OpenFashion AI-powered fashion analyzer. Learn how to use our style discovery app, understand AI analysis, and get the best results.',
  keywords: ['FAQ', 'fashion analyzer questions', 'AI fashion help', 'style app support', 'fashion analysis guide'],
  openGraph: {
    title: 'FAQ - OpenFashion AI Fashion Analyzer',
    description: 'Get answers to common questions about our AI-powered fashion analyzer and style discovery app.',
  },
}

export default function FAQPage() {
  const faqs = [
    {
      question: "How does OpenFashion's AI fashion analyzer work?",
      answer: "OpenFashion uses advanced AI technology to analyze uploaded clothing images. Our system identifies fashion items, colors, patterns, and styles, then provides similar item recommendations and personalized style advice. Simply upload a photo of any clothing item, and our AI will analyze it and find similar options for you."
    },
    {
      question: "What types of clothing can I analyze?",
      answer: "You can analyze various clothing items including tops, dresses, pants, shoes, accessories, and more. Our AI can identify different styles, colors, patterns, and even specific fashion elements. The more clear and well-lit your photo is, the better the analysis results will be."
    },
    {
      question: "How accurate is the AI fashion analysis?",
      answer: "Our AI provides highly accurate fashion analysis with advanced image recognition technology. Results improve with clear, well-lit images of clothing items. The system continuously learns and improves to provide better recommendations over time."
    },
    {
      question: "Is OpenFashion free to use?",
      answer: "Yes, OpenFashion offers free fashion analysis with basic features. Premium features are available for enhanced functionality and unlimited searches. You can start using our AI analyzer immediately without any cost."
    },
    {
      question: "How do I get the best results from the fashion analyzer?",
      answer: "For the best results, use clear, well-lit photos of clothing items. Make sure the item is clearly visible and not obscured by other objects. Natural lighting works best, and try to capture the item from multiple angles if possible."
    },
    {
      question: "Can I save and organize my analyzed items?",
      answer: "Yes! OpenFashion includes a digital closet feature where you can save and organize all your analyzed fashion items. Create collections, track your style preferences, and build your perfect digital wardrobe."
    },
    {
      question: "How do I find similar clothes online?",
      answer: "After analyzing an item, our AI provides similar clothing recommendations with links to where you can purchase them. You can also use our reverse image search feature to find exact or similar items across multiple retailers."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We take your privacy seriously. Your uploaded images and personal data are encrypted and secure. We never share your personal information with third parties without your explicit consent."
    },
    {
      question: "Can I use OpenFashion on mobile devices?",
      answer: "Yes! OpenFashion is fully optimized for mobile devices. You can upload photos directly from your phone, analyze fashion items on the go, and access all features from any mobile browser."
    },
    {
      question: "What makes OpenFashion different from other fashion apps?",
      answer: "OpenFashion combines AI-powered image analysis with style discovery in a unique way. Unlike other apps, we provide instant analysis of any clothing item, find similar products, and offer personalized style recommendations all in one platform."
    },
    {
      question: "How often should I update my digital closet?",
      answer: "We recommend updating your digital closet regularly as you add new items to your wardrobe. This helps our AI better understand your style preferences and provide more accurate recommendations."
    },
    {
      question: "Can I share my style analysis with friends?",
      answer: "Yes! You can share your style analysis results and digital closet with friends. This is a great way to get style advice and discover new fashion items together."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Get answers to common questions about OpenFashion's AI-powered fashion analyzer
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? We're here to help!
            </p>
            <a
              href="mailto:openfashion.dev@gmail.com"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-meta-pink hover:bg-meta-pink/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 