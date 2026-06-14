import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cloneElement, isValidElement, useId, useMemo, useState } from "react";

type FormData = {
  schoolName: string;
  schoolType: string;
  county: string;
  students: string;
  teachers: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  interests: string[];
  preferredDate: string;
  preferredTime: string;
  demoType: string;
  notes: string;
};

const benefits = [
  {
    icon: ClipboardList,
    title: "Live CBC Assessment Walkthrough",
    description:
      "See how NONEAA handles assessment planning, grading, and competency tracking for CBC schools.",
  },
  {
    icon: Users,
    title: "Student & Teacher Management",
    description:
      "Explore admissions, class structures, teacher records, and day-to-day school operations.",
  },
  {
    icon: BarChart3,
    title: "Real Time Reports & Analytics",
    description:
      "Review dashboards and leadership reports for attendance, academics, and school performance.",
  },
  {
    icon: MessageSquare,
    title: "Parent Communication Tools",
    description:
      "Experience parent portal updates, messaging, and notifications that improve engagement.",
  },
];

const schoolTypes = [
  "Primary School",
  "Junior School",
  "Secondary School",
  "TVET Institution",
  "College",
];

const counties = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Kiambu",
  "Machakos",
  "Uasin Gishu",
  "Kakamega",
  "Nyeri",
  "Meru",
];

const interestAreas = [
  "CBC Assessment",
  "Student Management",
  "Fee Management",
  "Attendance Tracking",
  "Parent Portal",
  "Teacher Portal",
  "Analytics & Reports",
  "SMS Communication",
];

const demoTypes = ["Online Demo", "Physical Visit", "Phone Consultation"];

const timelineSteps = [
  "CBC Assessment Workflow",
  "Student Enrollment Process",
  "Report Generation",
  "Parent Portal Features",
  "Financial Management",
  "Questions & Answers Session",
];

const testimonials = [
  {
    school: "Karura Junior School, Nairobi",
    position: "Deputy Principal",
    text: "The demo was practical and tailored to our school. We quickly understood how NONEAA would support CBC reporting and communication.",
    rating: 5,
  },
  {
    school: "Mwangaza Girls Secondary, Nakuru",
    position: "ICT Officer",
    text: "Excellent walkthrough with clear examples. The analytics and parent engagement features matched exactly what we were evaluating.",
    rating: 5,
  },
  {
    school: "Lakeview TVET Centre, Kisumu",
    position: "Registrar",
    text: "Professional and focused demo session. Our team got clear next steps and confidence in implementation support.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How long is the demo?",
    answer: "Most demos take 45–60 minutes, depending on the modules your team wants to focus on.",
  },
  {
    question: "Is the demo free?",
    answer: "Yes. The demo is completely free with no obligation.",
  },
  {
    question: "Can multiple staff members attend?",
    answer: "Absolutely. We encourage principals, ICT officers, bursars, and academic leads to join.",
  },
  {
    question: "Do you offer implementation support?",
    answer: "Yes. We support onboarding, setup, training, and post-launch assistance.",
  },
  {
    question: "How soon can we get started after the demo?",
    answer: "Most schools begin onboarding within 1–2 weeks depending on readiness and timelines.",
  },
];

const initialFormData: FormData = {
  schoolName: "",
  schoolType: "",
  county: "",
  students: "",
  teachers: "",
  fullName: "",
  role: "",
  email: "",
  phone: "",
  interests: [],
  preferredDate: "",
  preferredTime: "",
  demoType: "",
  notes: "",
};

const NoneaaPlatformPage = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleInput = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleInterest = (interest: string) => {
    const nextInterests = formData.interests.includes(interest)
      ? formData.interests.filter((item) => item !== interest)
      : [...formData.interests, interest];

    handleInput("interests", nextInterests);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.schoolName.trim()) nextErrors.schoolName = "School name is required.";
    if (!formData.schoolType) nextErrors.schoolType = "School type is required.";
    if (!formData.county) nextErrors.county = "County is required.";
    if (!formData.students) nextErrors.students = "Number of students is required.";
    if (!formData.teachers) nextErrors.teachers = "Number of teachers is required.";
    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!formData.role.trim()) nextErrors.role = "Position / Role is required.";
    if (!formData.email.trim()) nextErrors.email = "Email address is required.";
    if (!formData.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (formData.interests.length === 0)
      nextErrors.interests = "Select at least one area of interest.";
    if (!formData.preferredDate) nextErrors.preferredDate = "Preferred date is required.";
    if (!formData.preferredTime) nextErrors.preferredTime = "Preferred time is required.";
    if (!formData.demoType) nextErrors.demoType = "Demo type is required.";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    const kenyanPhonePattern = /^(\+254|254|0)(1|7)\d{8}$/;
    if (formData.phone && !kenyanPhonePattern.test(formData.phone.replace(/\s+/g, ""))) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSubmitState("loading");
    setSubmitError("");

    try {
      // TODO: Replace with real booking API integration when endpoint is available.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("You appear to be offline. Please check your internet connection and try again.");
      }

      setSubmitState("success");
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your demo request. Please try again or contact support.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 text-white py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,0.2),transparent_55%)]" />
          <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Ministry Approved
              </span>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Book Your Personalized Demo
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mb-8">
                Schedule a live demonstration of NONEAA and explore exactly how your school can improve CBC workflows, reporting, and parent engagement.
              </p>
              <a
                href="#book-demo-form"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300"
              >
                Book a Demo
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-400/10 border border-white/20 p-6 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-cyan-200">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-sm font-medium">Professional education-focused walkthrough</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                    <p className="text-xs text-blue-100">Demo length</p>
                    <p className="font-semibold">45 - 60 mins</p>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/20 p-3">
                    <p className="text-xs text-blue-100">Audience</p>
                    <p className="font-semibold">School leadership</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.article
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-950/300 to-teal-500 flex items-center justify-center text-white mb-4">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.25fr_0.75fr] gap-8">
            <div id="book-demo-form" className="bg-white/85 backdrop-blur-md border border-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Schedule My Demo</h2>

              {submitState === "success" ? (
                <div className="py-10 text-center">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank you!</h3>
                  <p className="text-slate-600">Your request has been received successfully.</p>
                  <p className="text-blue-700 font-medium mt-1">Our team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                  <FieldGroup title="School Information">
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField label="School Name" required error={errors.schoolName}>
                        <input value={formData.schoolName} onChange={(e) => handleInput("schoolName", e.target.value)} />
                      </InputField>

                      <InputField label="School Type" required error={errors.schoolType}>
                        <select value={formData.schoolType} onChange={(e) => handleInput("schoolType", e.target.value)}>
                          <option value="">Select school type</option>
                          {schoolTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </InputField>

                      <InputField label="County" required error={errors.county}>
                        <select value={formData.county} onChange={(e) => handleInput("county", e.target.value)}>
                          <option value="">Select county</option>
                          {counties.map((county) => (
                            <option key={county} value={county}>{county}</option>
                          ))}
                        </select>
                      </InputField>

                      <InputField label="Number of Students" required error={errors.students}>
                        <input type="number" min="1" value={formData.students} onChange={(e) => handleInput("students", e.target.value)} />
                      </InputField>

                      <InputField label="Number of Teachers" required error={errors.teachers}>
                        <input type="number" min="1" value={formData.teachers} onChange={(e) => handleInput("teachers", e.target.value)} />
                      </InputField>
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Contact Information">
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField label="Full Name" required error={errors.fullName} icon={<User className="w-4 h-4" />}>
                        <input value={formData.fullName} onChange={(e) => handleInput("fullName", e.target.value)} />
                      </InputField>

                      <InputField label="Position / Role" required error={errors.role}>
                        <input value={formData.role} onChange={(e) => handleInput("role", e.target.value)} />
                      </InputField>

                      <InputField label="Email Address" required error={errors.email} icon={<Mail className="w-4 h-4" />}>
                        <input type="email" value={formData.email} onChange={(e) => handleInput("email", e.target.value)} />
                      </InputField>

                      <InputField label="Phone Number" required error={errors.phone} icon={<Phone className="w-4 h-4" />}>
                        <input value={formData.phone} onChange={(e) => handleInput("phone", e.target.value)} />
                      </InputField>
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Areas of Interest">
                    <div className="grid md:grid-cols-2 gap-3">
                      {interestAreas.map((interest, index) => {
                        const checkboxId = `interest-${index}`;
                        return (
                          <label key={interest} htmlFor={checkboxId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer">
                            <input id={checkboxId} type="checkbox" checked={formData.interests.includes(interest)} onChange={() => toggleInterest(interest)} />
                            <span className="text-sm text-slate-700">{interest}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.interests ? <p className="text-sm text-rose-600 mt-2">{errors.interests}</p> : null}
                  </FieldGroup>

                  <FieldGroup title="Scheduling">
                    <div className="grid md:grid-cols-3 gap-4">
                      <InputField label="Preferred Date" required error={errors.preferredDate}>
                        <input type="date" min={minDate} value={formData.preferredDate} onChange={(e) => handleInput("preferredDate", e.target.value)} />
                      </InputField>

                      <InputField label="Preferred Time" required error={errors.preferredTime}>
                        <input type="time" value={formData.preferredTime} onChange={(e) => handleInput("preferredTime", e.target.value)} />
                      </InputField>

                      <InputField label="Demo Type" required error={errors.demoType}>
                        <select value={formData.demoType} onChange={(e) => handleInput("demoType", e.target.value)}>
                          <option value="">Select demo type</option>
                          {demoTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </InputField>
                    </div>
                  </FieldGroup>

                  <FieldGroup title="Additional Notes">
                    <InputField label="School specific requirements">
                      <textarea
                        rows={5}
                        value={formData.notes}
                        onChange={(e) => handleInput("notes", e.target.value)}
                        placeholder="Tell us your school priorities and any requirements."
                      />
                    </InputField>
                  </FieldGroup>

                  <button
                    type="submit"
                    disabled={submitState === "loading"}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-teal-700 transition disabled:opacity-60"
                  >
                    {submitState === "loading" ? (
                      <>
                        <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Scheduling Your Demo...
                      </>
                    ) : (
                      <>
                        Schedule My Demo
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {submitState === "error" ? (
                    <p className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      {submitError || "Unable to submit your demo request. Please check your connection and try again."}
                    </p>
                  ) : null}
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  What You&apos;ll See During The Demo
                </h3>
                <div className="space-y-3">
                  {timelineSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 text-white text-xs font-bold inline-flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-slate-700 text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {testimonials.map((testimonial) => (
                <div key={testimonial.school} className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-lg">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm mb-3">“{testimonial.text}”</p>
                  <p className="font-semibold text-slate-900 text-sm">{testimonial.school}</p>
                  <p className="text-xs text-blue-700">{testimonial.position}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-slate-900 text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="bg-slate-800 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{faq.question}</span>
                    <ArrowRight className={`w-4 h-4 text-blue-600 transition-transform ${activeFaq === index ? "rotate-90" : ""}`} />
                  </button>
                  {activeFaq === index ? (
                    <p className="px-5 pb-4 text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InputField({
  label,
  required,
  error,
  children,
  icon,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const fieldId = useId();
  const controlClassName =
    "w-full rounded-xl border border-slate-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500";
  const enhancedChild = isValidElement(children)
    ? cloneElement(children, {
        id: fieldId,
        "aria-invalid": Boolean(error),
        className: `${controlClassName} ${children.props.className ?? ""}`.trim(),
      })
    : children;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="text-sm font-medium text-slate-700 block mb-2">
        {label}
        {required ? " *" : ""}
      </span>
      <div className="relative">
        {icon ? <span className="absolute right-3 top-3 text-slate-400">{icon}</span> : null}
        {enhancedChild}
      </div>
      {error ? <span className="text-xs text-rose-600 mt-1 block">{error}</span> : null}
    </label>
  );
}

export default NoneaaPlatformPage;
