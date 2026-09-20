// src/pages/Portal/FeaturesSection.tsx
import React, { useState } from "react";
import {
  Shield,
  Smartphone,
  BarChart3,
  Users,
  Lock,
  Award,
  Fingerprint,
  MailCheck,
  Clock,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  solid: string;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: "Secure Voting",
    description: "Face recognition technology ensures only eligible students can vote.",
    color: "blue",
    solid: "bg-blue-500",
  },
  {
    icon: Fingerprint,
    title: "Biometric Auth",
    description: "Facial recognition for secure mobile voting access.",
    color: "indigo",
    solid: "bg-indigo-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Vote from anywhere using our mobile application.",
    color: "green",
    solid: "bg-green-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Results",
    description: "View live election results as votes are counted.",
    color: "purple",
    solid: "bg-purple-500",
  },
  {
    icon: Users,
    title: "Candidate Profiling",
    description: "Comprehensive candidate information to make informed decisions.",
    color: "pink",
    solid: "bg-pink-500",
  },
  {
    icon: Lock,
    title: "Voter Anonymity",
    description: "Your vote is secret and cannot be traced back to you.",
    color: "red",
    solid: "bg-red-500",
  },
  {
    icon: Award,
    title: "Fair Elections",
    description: "Automated vote counting eliminates manual errors.",
    color: "orange",
    solid: "bg-orange-500",
  },
  {
    icon: MailCheck,
    title: "Digital Receipt",
    description: "Receives email after successful vote submission.",
    color: "teal",
    solid: "bg-teal-500",
  },
  {
    icon: Clock,
    title: "Campaign Manager",
    description: "Scheduled campaigning to prevent class disruptions.",
    color: "cyan",
    solid: "bg-cyan-500",
  },
];

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  solid: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, solid, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute inset-0 ${solid} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

      <div className={`relative w-14 h-14 rounded-2xl ${solid} flex items-center justify-center mb-5 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>

      <div className={`absolute bottom-0 left-0 right-0 h-1 ${solid} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-5">
            <TrendingUp className="w-4 h-4 mr-2" />
            Why Choose Us
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            Modern Features for{" "}
            <span className="text-blue-600">
              Fair Elections
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform combines cutting-edge security with user-friendly design to deliver the best voting experience for every student.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;