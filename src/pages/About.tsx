import { Users, Award, Globe, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function About() {
  const values = [
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Quality First',
      description: 'We source only the finest materials and work with skilled artisans to create products that stand the test of time.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Sustainability',
      description: 'Environmental responsibility is at the core of everything we do, from sourcing to packaging.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community',
      description: 'We believe in building lasting relationships with our customers, partners, and the communities we serve.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Passion',
      description: 'Our love for exceptional design and craftsmanship drives us to continuously innovate and improve.'
    }
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'Founder & CEO',
      image: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Former fashion executive with 15 years of experience in luxury retail.'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Head of Design',
      image: 'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Award-winning designer with a passion for minimalist aesthetics.'
    },
    {
      name: 'Emma Thompson',
      role: 'Sustainability Director',
      image: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Environmental scientist dedicated to sustainable fashion practices.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-editorial-hero mb-8">About BOLTSHOP</h1>
          <p className="text-editorial-body text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            Founded in 2020, BOLTSHOP represents a new generation of conscious fashion. 
            We believe that style and sustainability can coexist, creating pieces that are 
            both beautiful and responsible.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div className="space-y-6">
            <h2 className="text-editorial-heading">Our Story</h2>
            <div className="space-y-4 text-editorial-body text-muted-foreground">
              <p>
                BOLTSHOP was born from a simple idea: fashion should be both beautiful and responsible. 
                Our founder, Sarah Chen, spent years in the traditional fashion industry before realizing 
                that change was needed.
              </p>
              <p>
                We started with a small collection of essential pieces, each carefully designed and 
                ethically produced. Today, we've grown into a global brand while maintaining our 
                commitment to quality, sustainability, and timeless design.
              </p>
              <p>
                Every piece in our collection tells a story of craftsmanship, from the organic cotton 
                grown by our partner farms to the skilled artisans who bring our designs to life.
              </p>
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img
              src="https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Our atelier"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-editorial-heading mb-6">Our Values</h2>
            <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do, from design to delivery.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="card-editorial text-center">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-primary-foreground">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-editorial-heading mb-6">Meet Our Team</h2>
            <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals behind BOLTSHOP's vision and mission.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="card-editorial text-center">
                <CardContent className="pt-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-4">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="text-center bg-muted p-12 rounded-none">
          <h2 className="text-editorial-heading mb-6">Our Mission</h2>
          <p className="text-editorial-body text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            "To create timeless, sustainable fashion that empowers individuals to express 
            their unique style while making a positive impact on the world. We believe that 
            conscious choices in fashion can drive meaningful change for our planet and communities."
          </p>
          <div className="mt-8">
            <p className="text-sm text-muted-foreground">— Sarah Chen, Founder & CEO</p>
          </div>
        </div>
      </div>
    </div>
  );
}