import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Award, Users, CheckCircle, Lightbulb, GraduationCap, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';


export default function CBCStandardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              CBC Standards & Framework
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Understanding Kenya's Competency-Based Curriculum (CBC) and our commitment to educational excellence.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  What is the Competency-Based Curriculum (CBC)?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  The Competency-Based Curriculum (CBC) is Kenya's educational framework designed to nurture every learner's 
                  potential through a holistic approach to education. Introduced in 2017, CBC focuses on developing competencies, 
                  skills, and values rather than just theoretical knowledge.
                </p>
                <p>
                  Our platform aligns with the Kenya Institute of Curriculum Development (KICD) standards, ensuring that educational 
                  institutions can effectively implement and track CBC learning outcomes.
                </p>
              </CardContent>
            </Card>

            {/* Core Competencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Core Competencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  CBC focuses on seven core competencies that learners should develop:
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Communication and Collaboration',
                      description: 'Ability to listen, speak, read, and write in various modes and contexts. Working effectively with others in diverse settings.'
                    },
                    {
                      title: 'Critical Thinking and Problem Solving',
                      description: 'Analyzing issues, making informed decisions, and finding creative solutions to challenges.'
                    },
                    {
                      title: 'Imagination and Creativity',
                      description: 'Using imagination to generate new ideas, products, and solutions through innovation and inventiveness.'
                    },
                    {
                      title: 'Citizenship',
                      description: 'Understanding rights, responsibilities, and duties as a Kenyan citizen and global citizen.'
                    },
                    {
                      title: 'Digital Literacy',
                      description: 'Effectively using digital technologies to find, evaluate, create, and communicate information.'
                    },
                    {
                      title: 'Learning to Learn',
                      description: 'Taking charge of one\'s own learning and pursuing knowledge independently and collaboratively.'
                    },
                    {
                      title: 'Self-Efficacy',
                      description: 'Developing confidence in one\'s abilities to achieve goals and overcome challenges.'
                    }
                  ].map((competency, index) => (
                    <div key={index} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">{competency.title}</h4>
                        <p className="text-sm text-muted-foreground">{competency.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Learning Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  CBC organizes learning into the following areas:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    'Languages',
                    'Mathematics',
                    'Environmental Activities',
                    'Hygiene and Nutrition',
                    'Creative Activities',
                    'Religious Education',
                    'Integrated Science',
                    'Health Education',
                    'Pre-Technical and Pre-Career Education',
                    'Social Studies',
                    'Physical and Sports Education',
                    'Business Studies',
                    'Agriculture',
                    'Life Skills Education'
                  ].map((area) => (
                    <div key={area} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-muted-foreground">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Assessment Framework */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Assessment and Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Formative Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      Ongoing assessment conducted during the learning process to monitor learner progress and provide 
                      feedback for improvement. Our platform supports continuous formative assessment through various tools 
                      and tracking mechanisms.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Summative Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      Conducted at the end of a learning period to evaluate learner achievement against set standards. 
                      The platform facilitates comprehensive summative assessments aligned with KICD guidelines.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Competency-Based Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      Assessment focuses on what learners can do with their knowledge and skills, rather than just 
                      what they know. Our system tracks competency development across all learning areas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Values and Principles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  CBC Values and Principles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The CBC is founded on these core values:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                  <li><strong>Respect:</strong> For self, others, and the environment</li>
                  <li><strong>Unity:</strong> Promoting national cohesion and patriotism</li>
                  <li><strong>Responsibility:</strong> Being accountable for one's actions</li>
                  <li><strong>Peace:</strong> Fostering peaceful coexistence and conflict resolution</li>
                  <li><strong>Love:</strong> Caring for others and showing compassion</li>
                  <li><strong>Integrity:</strong> Honesty and adherence to moral principles</li>
                  <li><strong>Patriotism:</strong> Love and devotion to one's country</li>
                </ul>
              </CardContent>
            </Card>

            {/* Platform Alignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  How Our Platform Supports CBC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Noneaa is specifically designed to support CBC implementation:
                </p>
                <div className="space-y-3">
                  {[
                    {
                      title: 'Competency Tracking',
                      description: 'Track learner progress across all seven core competencies with detailed analytics.'
                    },
                    {
                      title: 'Curriculum Alignment',
                      description: 'All content and assessments are mapped to KICD curriculum designs and learning outcomes.'
                    },
                    {
                      title: 'Formative Assessment Tools',
                      description: 'Built-in tools for continuous assessment and feedback aligned with CBC principles.'
                    },
                    {
                      title: 'Progress Reports',
                      description: 'Comprehensive reports that communicate learner development to parents and guardians.'
                    },
                    {
                      title: 'Teacher Support',
                      description: 'Resources and tools to help teachers effectively deliver CBC lessons and track outcomes.'
                    },
                    {
                      title: 'Data-Driven Insights',
                      description: 'Analytics dashboard to monitor school-wide CBC implementation and learner performance.'
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-primary/5">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  CBC Education Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Early Years Education (EYE)</h4>
                    <p className="text-sm text-muted-foreground">
                      Pre-Primary 1 and Pre-Primary 2 (ages 4-5 years) - Focus on play-based learning and early 
                      childhood development.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Lower Primary</h4>
                    <p className="text-sm text-muted-foreground">
                      Grades 1-3 - Building foundational literacy, numeracy, and basic competencies.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Upper Primary</h4>
                    <p className="text-sm text-muted-foreground">
                      Grades 4-6 - Deepening knowledge and skills across learning areas.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Lower Secondary</h4>
                    <p className="text-sm text-muted-foreground">
                      Grades 7-9 - Introducing specialized learning pathways and career exploration.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Senior Secondary</h4>
                    <p className="text-sm text-muted-foreground">
                      Grades 10-12 - Focused pathway learning in preparation for tertiary education or career pathways.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources and References */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>
                  Learn more about Kenya's CBC framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    For more information about the Competency-Based Curriculum, visit:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Kenya Institute of Curriculum Development (KICD) - <a href="https://kicd.ac.ke" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">kicd.ac.ke</a></li>
                    <li>Ministry of Education - Official CBC Guidelines and Resources</li>
                    <li>Teachers Service Commission (TSC) - CBC Implementation Support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Questions About CBC Standards?</CardTitle>
                <CardDescription>
                  Our team is here to help you understand and implement CBC effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-sm text-muted-foreground">cbc-support@noneaa.africa</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Phone</h4>
                    <p className="text-sm text-muted-foreground">+254 111 276 271</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Address</h4>
                    <p className="text-sm text-muted-foreground">
                      Noneaa Africa<br />
                      Nairobi, Kenya
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">CBC Curriculum Team</h4>
                    <p className="text-sm text-muted-foreground">curriculum@noneaa.africa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
