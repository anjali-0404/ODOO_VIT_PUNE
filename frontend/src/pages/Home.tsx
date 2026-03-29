import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  Menu, 
  X,
  ArrowRight,
  CheckCircle,
  Star,
  Calendar,
  FileText,
  CreditCard
} from 'lucide-react';

export const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Smart Expense Tracking",
      description: "Automatically categorize and track all your business expenses with intelligent AI-powered recognition."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with automated compliance checks and audit trails."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Submit, review, and approve expenses in minutes, not days."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Seamless collaboration between employees, managers, and finance teams."
    }
  ];

  const stats = [
    { label: "Happy Users", value: "10K+" },
    { label: "Claims Processed", value: "500K+" },
    { label: "Time Saved", value: "90%" },
    { label: "Approval Rate", value: "98%" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Finance Manager",
      company: "TechCorp Inc.",
      quote: "This platform has revolutionized our expense management. We've reduced processing time by 80% and improved employee satisfaction significantly.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Michael Chen",
      role: "Sales Director",
      company: "Global Solutions",
      quote: "The mobile app makes expense reporting so easy. I can submit receipts on the go and get reimbursed within 24 hours.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "Creative Agency",
      quote: "The analytics dashboard gives us incredible insights into our spending patterns. Budgeting has never been easier.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 users",
        "Basic expense tracking",
        "Email support",
        "Mobile app access"
      ],
      cta: "Get Started"
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For growing businesses",
      features: [
        "Up to 25 users",
        "Advanced analytics",
        "Priority support",
        "Custom workflows",
        "API access"
      ],
      cta: "Try Professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited users",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced security",
        "24/7 support"
      ],
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                ExpenseFlow
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Reviews</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <a 
                href="/login" 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Sign In
              </a>
              <a 
                href="/signup" 
                className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
              <div className="py-4 space-y-4">
                <a href="#features" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
                <a href="#pricing" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
                <a href="#testimonials" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium">Reviews</a>
                <a href="#contact" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
                <div className="pt-4 border-t border-gray-200/50 space-y-2">
                  <a 
                    href="/login" 
                    className="block text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    Sign In
                  </a>
                  <a 
                    href="/signup" 
                    className="block w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white text-center py-2 rounded-full font-semibold"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 mr-2" />
                  Trusted by 10,000+ businesses
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                  Simplify Your
                  <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Expense Management</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Streamline expense reporting, accelerate approvals, and gain powerful insights 
                  into your business spending. All in one intuitive platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/signup"
                  className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
                <a 
                  href="#demo"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300 flex items-center justify-center"
                >
                  Watch Demo
                </a>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-white border-2 border-gray-200 rounded-full"
                      style={{ zIndex: 5 - i }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Join 10,000+ satisfied users</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-gray-900">$12,450</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">23</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { icon: <Calendar className="w-5 h-5" />, title: "Team Lunch", amount: "$156.50", date: "Today" },
                    { icon: <FileText className="w-5 h-5" />, title: "Office Supplies", amount: "$89.99", date: "Yesterday" },
                    { icon: <CreditCard className="w-5 h-5" />, title: "Client Dinner", amount: "$245.00", date: "2 days ago" }
                  ].map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          {expense.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expense.title}</p>
                          <p className="text-sm text-gray-500">{expense.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{expense.amount}</p>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-linear-to-r from-purple-400 to-pink-400 rounded-xl opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-linear-to-r from-blue-400 to-indigo-400 rounded-xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Manage Expenses</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From receipt capture to approval workflows, our platform provides comprehensive 
              tools to streamline your expense management process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-linear-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a 
              href="/signup"
              className="inline-flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <span>Explore All Features</span>
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-linear-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Loved by
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Teams Worldwide</span>
            </h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied customers who have transformed their expense management.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your team's needs. No hidden fees, no surprises.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white p-8 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                plan.popular 
                  ? 'border-blue-200 ring-2 ring-blue-100 transform -translate-y-2' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a 
                  href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`w-full block text-center py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Expense Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have streamlined their expense processes 
            and improved their financial visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Your Free Trial
            </a>
            <a 
              href="/demo"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Schedule a Demo
            </a>
          </div>
          <p className="text-blue-200 text-sm mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ExpenseFlow</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Simplifying expense management for businesses of all sizes. 
                Our platform helps you save time, reduce costs, and gain valuable insights.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'LinkedIn', 'Facebook'].map((social) => (
                  <a key={social} href="#" className="text-gray-400 hover:text-white transition-colors">
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-gray-400 text-sm">
            <p>&copy; 2024 ExpenseFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

