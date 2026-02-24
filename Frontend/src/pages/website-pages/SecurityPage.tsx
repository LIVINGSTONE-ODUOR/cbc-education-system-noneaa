import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock, Eye, AlertTriangle, Server, KeyRound, Mail, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Security
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We take the security of your data seriously. Learn how we protect your information and our platform.
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
            {/* Our Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Our Security Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  At EduStack Africa, the security of your data is our highest priority. We understand
                  that our platform handles sensitive educational records, student information, and
                  institutional data. We are committed to maintaining robust security practices to
                  safeguard this information at all times.
                </p>
                <p>
                  Our security program is designed to protect your data against unauthorized access,
                  disclosure, alteration, and destruction.
                </p>
              </CardContent>
            </Card>

            {/* Data Encryption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Data Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We use industry-standard encryption to protect your data:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher</li>
                  <li>Sensitive data stored on our servers is encrypted at rest using AES-256</li>
                  <li>Passwords are hashed using industry-standard algorithms and are never stored in plain text</li>
                  <li>Encryption keys are managed securely and rotated regularly</li>
                </ul>
              </CardContent>
            </Card>

            {/* Access Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Access Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Role-Based Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Our platform uses role-based access control (RBAC) to ensure that users can only
                      access the data and features they are authorized to use. Roles include school
                      administrators, teachers, students, and parents.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      We require strong passwords and support multi-factor authentication (MFA) to
                      add an extra layer of security to your account.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Session Management</h4>
                    <p className="text-sm text-muted-foreground">
                      User sessions are managed securely with automatic timeouts for inactive sessions
                      to reduce the risk of unauthorized access.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Infrastructure Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Our infrastructure is designed with security in mind:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Hosted on secure, compliant cloud infrastructure with physical access controls</li>
                  <li>Regular vulnerability scans and penetration testing</li>
                  <li>Automated threat detection and intrusion prevention systems</li>
                  <li>Network segmentation to limit the blast radius of any potential incident</li>
                  <li>Regular security patches and updates applied to all systems</li>
                  <li>Redundant backups with geographically distributed storage</li>
                </ul>
              </CardContent>
            </Card>

            {/* Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Monitoring and Incident Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">24/7 Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Our systems are monitored around the clock for unusual activity, potential threats,
                      and performance issues to ensure rapid detection of any security events.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Incident Response Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      We maintain a documented incident response plan that is regularly reviewed and
                      tested. In the event of a security incident, we will notify affected users in
                      accordance with applicable legal requirements.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive audit logs are maintained for all administrative actions and data
                      access to support security investigations and compliance requirements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Compliance and Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We adhere to recognized security standards and regulations:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Kenya Data Protection Act, 2019</li>
                  <li>ISO/IEC 27001 information security management principles</li>
                  <li>OWASP Top 10 web application security best practices</li>
                  <li>Regular third-party security audits and assessments</li>
                  <li>Employee security awareness training and background checks</li>
                </ul>
              </CardContent>
            </Card>

            {/* Reporting Vulnerabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Responsible Disclosure</CardTitle>
                <CardDescription>
                  Found a security vulnerability? We encourage responsible disclosure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you believe you have discovered a security vulnerability in our platform, we
                  encourage you to report it to us responsibly. Please do not publicly disclose the
                  vulnerability until we have had a chance to address it.
                </p>
                <p className="text-sm text-muted-foreground">
                  To report a vulnerability, please contact our security team at{' '}
                  <span className="font-medium text-foreground">security@edustack.africa</span>.
                  We will acknowledge your report within 48 hours and work with you to resolve
                  the issue as quickly as possible.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Our Security Team</CardTitle>
                <CardDescription>
                  For security-related questions or concerns, please reach out to us:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" /> Security Email</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">security@edustack.africa</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" /> Phone</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">+254 111 276 271</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Address</h4>
                    <p className="text-sm text-muted-foreground">
                      EduStack Africa<br />
                      Nairobi, Kenya
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Protection Officer</h4>
                    <p className="text-sm text-muted-foreground">dpo@edustack.africa</p>
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
