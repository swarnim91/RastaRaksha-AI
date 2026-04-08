import { Link } from 'react-router-dom';
import { Eye, Brain, ArrowRight, AlertTriangle, Car, DollarSign } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: AlertTriangle,
      title: 'Pothole Detection',
      titleHi: 'गड्ढा पहचान',
      description: 'Real-time AI detection of potholes and road hazards',
      descriptionHi: 'वास्तविक समय में गड्ढों की पहचान',
    },
    {
      icon: Eye,
      title: 'Drowsiness Monitor',
      titleHi: 'नींद की निगरानी',
      description: 'Advanced eye tracking to prevent drowsy driving',
      descriptionHi: 'आंखों की निगरानी से नींद का पता लगाना',
    },
    {
      icon: Brain,
      title: 'AI Safety Assistant',
      titleHi: 'AI सुरक्षा सहायक',
      description: 'Chat with AI for instant road safety guidance',
      descriptionHi: 'सड़क सुरक्षा के लिए AI से बात करें',
    },
  ];

  const stats = [
    { icon: AlertTriangle, value: '1.5 Lakh+', label: 'Deaths/Year', labelHi: 'मौतें/वर्ष' },
    { icon: Car, value: '300M+', label: 'Vehicles', labelHi: 'वाहन' },
    { icon: DollarSign, value: '₹5L Crore', label: 'Economic Loss', labelHi: 'आर्थिक नुकसान' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E53935]/10 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-36 h-36 rounded-3xl object-cover shadow-2xl shadow-red-500/20" style={{ border: '3px solid rgba(229,57,53,0.2)' }} />
            </div>

            <h1 className="text-6xl font-bold text-white mb-4">
              RastaRaksha AI
            </h1>
            <p className="text-3xl text-gray-300 mb-2">
              भारत का पहला AI सड़क सुरक्षा सहायक
            </p>
            <p className="text-xl text-[#E53935] font-semibold mb-8">
              India's First GenAI Road Safety Co-Pilot
            </p>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#E53935] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#C62828] transition-all transform hover:scale-105"
            >
              Start Secure Drive
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#E53935] transition-all transform hover:-translate-y-2"
                >
                  <div className="w-12 h-12 bg-[#E53935]/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#E53935]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{feature.titleHi}</p>
                  <p className="text-gray-300">{feature.description}</p>
                  <p className="text-gray-500 text-sm mt-1">{feature.descriptionHi}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1A1A1A] border border-[#E53935]/30 rounded-xl p-8">
            <h2 className="text-center text-2xl font-bold text-white mb-2">
              India's Road Safety Crisis
            </h2>
            <p className="text-center text-gray-400 mb-8">भारत की सड़क सुरक्षा संकट</p>

            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon className="w-8 h-8 text-[#E53935] mx-auto mb-3" />
                    <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-gray-300">{stat.label}</div>
                    <div className="text-gray-500 text-sm">{stat.labelHi}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
