import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function TermsPage() {
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
              <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Terms of Service
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              Please read these terms carefully before using our Competency-Based Education platform.
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
            {/* Acceptance of Terms */}
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
                    <Scale className="w-5 h-5" />
                    Acceptance of Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>
                    By accessing and using the Noneaa Africa platform ("Service"), you accept and agree to be bound by the terms
                    and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                  <p>
                    These Terms of Service apply to all users of the Service, including without limitation users who are browsers,
                    vendors, customers, merchants, and/or contributors of content.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Description of Service */}
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
                    Description of Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Noneaa Africa provides a comprehensive Competency-Based Curriculum (CBC) platform that includes:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Student progress tracking and assessment management</li>
                    <li>Curriculum mapping and learning objective alignment</li>
                    <li>Teacher evaluation and feedback tools</li>
                    <li>Parent communication and progress monitoring</li>
                    <li>Administrative dashboard and reporting features</li>
                    <li>Data analytics and performance insights</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Accounts */}
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
                  <CardTitle>User Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Account Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        To access certain features of the Service, you must create an account. You are responsible for maintaining
                        the confidentiality of your account credentials and for all activities that occur under your account.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Account Responsibilities</h4>
                      <p className="text-sm text-muted-foreground">
                        You agree to provide accurate, current, and complete information during the registration process and to
                        update such information to keep it accurate, current, and complete.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Account Termination</h4>
                      <p className="text-sm text-muted-foreground">
                        We reserve the right to terminate or suspend your account and access to the Service at our sole discretion,
                        without prior notice, for conduct that we believe violates these Terms or is harmful to other users,
                        us, or third parties, or for any other reason.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Acceptable Use */}
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
                  <CardTitle>Acceptable Use Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    You agree not to use the Service to:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Transmit harmful, offensive, or inappropriate content</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with the proper functioning of the Service</li>
                    <li>Use the Service for any commercial purpose without authorization</li>
                    <li>Share account credentials or allow unauthorized access</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Intellectual Property */}
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
                  <CardTitle>Intellectual Property Rights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive property
                    of Noneaa Africa and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You may not duplicate, copy, or reuse any portion of the HTML/CSS, JavaScript, visual design elements, or concepts
                    without express written permission from us.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy Policy */}
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
                  <CardTitle>Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service,
                    to understand our practices regarding the collection and use of your personal information.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data and Content */}
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
                  <CardTitle>Data and Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">User-Generated Content</h4>
                      <p className="text-sm text-muted-foreground">
                        You retain ownership of any content you submit, post, or display on or through the Service. By submitting
                        content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute
                        your content in connection with the Service.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Educational Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Student assessment data, progress tracking, and educational records are handled in accordance with
                        applicable privacy laws and our educational data management policies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Disclaimers */}
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
                  <CardTitle>Disclaimers and Limitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Service Availability</h4>
                      <p className="text-sm text-muted-foreground">
                        The Service is provided on an "as is" and "as available" basis. We do not warrant that the Service will
                        be uninterrupted, timely, secure, or error-free.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Educational Use</h4>
                      <p className="text-sm text-muted-foreground">
                        While we strive to provide accurate and helpful educational tools, the Service is not a substitute
                        for professional educational advice, assessment, or instruction.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Limitation of Liability</h4>
                      <p className="text-sm text-muted-foreground">
                        In no event shall Noneaa Africa be liable for any indirect, incidental, special, consequential,
                        or punitive damages arising out of or related to your use of the Service.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Termination */}
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
                  <CardTitle>Termination</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We may terminate or suspend your account and access to the Service immediately, without prior notice or
                    liability, for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which
                    by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers,
                    and limitations of liability.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Governing Law */}
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
                  <CardTitle>Governing Law</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These Terms shall be interpreted and governed by the laws of Kenya, without regard to conflict of law provisions. 
                    Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Changes to Terms */}
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
                  <CardTitle>Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
                    is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    By continuing to access or use our Service after those revisions become effective, you agree to be bound
                    by the revised terms. If you do not agree to the new terms, please stop using the Service.
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
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    If you have any questions about these Terms of Service, please contact us:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Email</h4>
                      <p className="text-sm text-muted-foreground">legal@noneaa.africa</p>
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
                      <h4 className="font-semibold mb-2">Legal Department</h4>
                      <p className="text-sm text-muted-foreground">legal@noneaa.africa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Severability */}
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
                    <AlertTriangle className="w-5 h-5" />
                    Severability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions
                    of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our
                    Service, and supersede and replace any prior agreements we might have between us regarding the Service.
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
