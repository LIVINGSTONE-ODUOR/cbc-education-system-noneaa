import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Users, Mail, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              Last updated: January 2026
            </motion.p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Introduction */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>
                    At Noneaa Africa, we are committed to protecting your privacy and ensuring the security of your personal information.
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Competency-Based
                    Curriculum (CBC) platform designed for Kenyan schools and educational institutions.
                  </p>
                  <p>
                    By using our services, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Information We Collect */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Information We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We may collect the following personal information:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Name and contact information (email, phone number)</li>
                      <li>Educational records and academic performance data</li>
                      <li>School and institutional affiliation</li>
                      <li>User account credentials</li>
                      <li>Profile information and preferences</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Usage Data</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We automatically collect certain information when you use our platform:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>IP address and location information</li>
                      <li>Browser type and version</li>
                      <li>Device information and screen resolution</li>
                      <li>Login times and session duration</li>
                      <li>Pages visited and features used</li>
                      <li>Assessment submissions and progress data</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* How We Use Your Information */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    How We Use Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Provide and maintain our educational platform services</li>
                    <li>Process and track student progress and assessments</li>
                    <li>Communicate with users about their accounts and progress</li>
                    <li>Improve our services and develop new features</li>
                    <li>Ensure platform security and prevent unauthorized access</li>
                    <li>Comply with legal obligations and educational regulations</li>
                    <li>Generate reports and analytics for educational institutions</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Information Sharing */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Information Sharing and Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    We may share your information in the following circumstances:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>With educational institutions for academic record management</li>
                    <li>With parents/guardians for student progress monitoring</li>
                    <li>With trusted third-party service providers for platform operations</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transfer or acquisition</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Security */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We implement appropriate technical and organizational security measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and user authentication</li>
                    <li>Secure data backup and recovery procedures</li>
                    <li>Employee training on data protection practices</li>
                    <li>Compliance with Kenya Data Protection Act, 2019</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Rights */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Your Rights and Choices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have the following rights regarding your personal information:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Access: Request a copy of your personal information</li>
                    <li>Correction: Request correction of inaccurate or incomplete data</li>
                    <li>Deletion: Request deletion of your personal information</li>
                    <li>Portability: Request transfer of your data to another service</li>
                    <li>Restriction: Request limitation of processing in certain circumstances</li>
                    <li>Objection: Object to processing based on legitimate interests</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    To exercise these rights, please contact us using the information provided below.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact Us</CardTitle>
                  <CardDescription>
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Email</h4>
                      <p className="text-sm text-muted-foreground">privacy@noneaa.africa</p>
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
                      <h4 className="font-semibold mb-2">Data Protection Officer</h4>
                      <p className="text-sm text-muted-foreground">dpo@noneaa.africa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Updates to Policy */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Updates to This Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
                    We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.
                    Your continued use of our services after such changes constitutes acceptance of the updated policy.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
