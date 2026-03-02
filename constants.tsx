
import React from 'react';
import {
  Plus,
  Sparkles,
  Cpu,
  Palette,
  Sun,
  Camera,
  Layers,
  CheckCircle,
  Eye
} from 'lucide-react';

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload Base',
    description: 'Capture your space or upload an existing image of an empty or outdated room.',
    icon: <Camera className="w-5 h-5 text-indigo-400" />
  },
  {
    step: '02',
    title: 'Select Style',
    description: 'Choose from 10+ premium interior presets including Modern, Tribal, or Industrial.',
    icon: <Palette className="w-5 h-5 text-purple-400" />
  },
  {
    step: '03',
    title: 'Configure Lighting',
    description: 'Toggle between professional daylight or warm ambient evening lighting.',
    icon: <Sun className="w-5 h-5 text-yellow-400" />
  },
  {
    step: '04',
    title: 'Review & Export',
    description: 'Compare designs using the slider and download high-resolution renders.',
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
  }
];

export const FEATURES = [
  {
    icon: <Palette className="w-6 h-6 text-indigo-400" />,
    title: 'Multi-Style Presets',
    description: 'Instantly swap between Modern, Vintage, Industrial and more with a single click.',
    tag: 'Design'
  },
  {
    icon: <Cpu className="w-6 h-6 text-purple-400" />,
    title: 'Precision AI Mapping',
    description: 'Our advanced engine preserves your room architectural boundaries while reimagining the design.',
    tag: 'Tech'
  },
  {
    icon: <Sun className="w-6 h-6 text-yellow-400" />,
    title: 'Dynamic Lighting',
    description: 'Preview your space in crisp daylight or warm, atmospheric evening glows.',
    tag: 'Ambient'
  },
  {
    icon: <Sparkles className="w-6 h-6 text-pink-400" />,
    title: '4K Photorealistic Export',
    description: 'Download high-resolution renders suitable for professional property listings.',
    tag: 'Output'
  },
  {
    icon: <Layers className="w-6 h-6 text-blue-400" />,
    title: 'Material Intelligence',
    description: 'AI understands textures—from velvet upholstery to brushed oak flooring.',
    tag: 'Detail'
  },
  {
    icon: <Eye className="w-6 h-6 text-emerald-400" />,
    title: 'Depth Perception',
    description: 'Accurate spatial awareness ensures furniture fits perfectly in every corner.',
    tag: 'Spatial'
  }
];

export const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    role: 'Luxury Real Estate Agent',
    content: 'Lumina Vision has completely changed how I show vacant properties. The photorealism is unmatched and my clients are consistently blown away.',
    avatar: 'https://picsum.photos/seed/sarah/100/100'
  },
  {
    name: 'Marcus Thorne',
    role: 'Interior Designer',
    content: 'The speed at which I can prototype style presets for my clients is a game-changer. It has cut my initial design phase by nearly 70%.',
    avatar: 'https://picsum.photos/seed/marcus/100/100'
  },
  {
    name: 'Elena Rossi',
    role: 'Homeowner',
    content: 'I used this to plan my renovation and the final result looks exactly like the AI preview! It saved me from making several costly mistakes.',
    avatar: 'https://picsum.photos/seed/elena/100/100'
  }
];

export const PRICING_PLANS = [
  {
    name: 'Basic',
    price: '$0',
    description: 'Perfect for exploring possibilities.',
    features: ['3 Generations / month', 'Standard Resolution', 'Basic Styles', 'Community Support'],
    buttonText: 'Start Free',
    highlight: false
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For real estate pros & designers.',
    features: ['Unlimited Generations', '4K Ultra HD Export', 'All Premium Styles', 'Priority AI Processing', 'Commercial License'],
    buttonText: 'Get Pro',
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Scalable solutions for teams.',
    features: ['API Access', 'Custom Style Training', 'Dedicated Account Manager', 'Bulk Export Tools', 'Team Collaboration'],
    buttonText: 'Contact Sales',
    highlight: false
  }
];

export const BLOG_POSTS = [
  {
    title: 'The Future of Virtual Staging',
    category: 'Industry',
    date: 'Feb 15, 2024',
    image: 'https://picsum.photos/seed/staging/800/600',
    readTime: '5 min read'
  },
  {
    title: 'Top 5 Interior Trends for 2024',
    category: 'Design',
    date: 'Feb 10, 2024',
    image: 'https://picsum.photos/seed/trends/800/600',
    readTime: '8 min read'
  },
  {
    title: 'AI vs Traditional Rendering',
    category: 'Technology',
    date: 'Feb 05, 2024',
    image: 'https://picsum.photos/seed/tech/800/600',
    readTime: '6 min read'
  }
];

export const FAQS = [
  {
    question: 'How accurate is the AI in maintaining room dimensions?',
    answer: 'The Lumina Vision engine uses depth-aware neural networks to ensure that furniture and structures respect the actual physical dimensions of your space.'
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support JPEG, PNG, and WebP formats. For best results, we recommend high-resolution photos taken in good natural light.'
  },
  {
    question: 'Can I use this for outdoor spaces?',
    answer: 'Yes! Select the "Outdoor Area" room type and choose a preset like "Coastal" or "Summer" for stunning garden and patio previews.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Your uploaded images are processed securely and are never shared with third parties. We prioritize user privacy and data integrity.'
  }
];
