import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  GraduationCap, 
  BarChart3, 
  Download, 
  Users,
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: FileText,
    title: '14 Question Types',
    description: 'From text inputs to matrix grids, we have all the question types you need for any survey or form.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Generate questions from topics or documents using Google Gemini AI in seconds.',
  },
  {
    icon: GraduationCap,
    title: 'Exam Mode',
    description: 'Timer, anti-cheat detection, auto-grading, question shuffling, and detailed result analysis.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Get insights with response statistics, completion rates, and per-question analysis.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Export responses to Excel or CSV with professional styling and formatting.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access control. Work together seamlessly.',
  },
];

const testimonials = [
  {
    name: 'Sarah L.',
    role: 'HR Manager',
    content: 'Pormulir has transformed how we conduct employee surveys. The AI generation saves us hours of work.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    name: 'Dr. Ahmad R.',
    role: 'University Professor',
    content: 'The exam mode with anti-cheat features gives me confidence in conducting online assessments.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    name: 'Maya K.',
    role: 'Product Manager',
    content: 'Beautiful forms that actually get completed. Our response rates improved by 40%.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
];

export function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-slide-down">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span>Powered by Google Gemini AI</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight animate-slide-up">
              Build Beautiful Forms
              <span className="block mt-2 bg-gradient-to-r from-accent-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                with AI Magic
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              Create surveys, quizzes, and exams in seconds. Let AI generate questions for you, 
              then analyze responses with powerful analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/login">
                <Button size="lg" className="gap-2 px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-4xl sm:text-5xl font-bold text-white">10K+</div>
                <div className="text-white/80 text-sm mt-2 font-medium">Forms Created</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-4xl sm:text-5xl font-bold text-white">500K+</div>
                <div className="text-white/80 text-sm mt-2 font-medium">Responses Collected</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="text-4xl sm:text-5xl font-bold text-white">99.9%</div>
                <div className="text-white/80 text-sm mt-2 font-medium">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to build amazing forms
            </h2>
            <p className="text-lg text-slate-600">
              Pormulir provides all the tools you need to create, distribute, and analyze 
              forms with ease.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 gradient-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white text-primary-600 text-sm font-medium mb-4 shadow-sm">
              How It Works
            </span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Create forms in 3 simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Describe Your Form', description: 'Tell AI what kind of form you need, or start from scratch with our intuitive builder.' },
              { step: '02', title: 'Customize & Publish', description: 'Fine-tune questions, set up exam mode or analytics, then publish with one click.' },
              { step: '03', title: 'Collect & Analyze', description: 'Share your form link and watch responses come in. Export or analyze results instantly.' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 h-full">
                  <div className="text-6xl font-bold text-primary-200 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Loved by teams everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to build better forms?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of teams already using Pormulir to create beautiful, 
            intelligent forms.
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              className="bg-white text-primary-600 hover:bg-slate-100 gap-2 px-8"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/60 text-sm mt-4">
            No credit card required • Free forever for individuals
          </p>
        </div>
      </section>
    </div>
  );
}

export default Landing;
