import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Stethoscope, AlertTriangle, ArrowRight, Activity } from "lucide-react";

const symptomsList = [
  "Fever", "Cough", "Headache", "Chest Pain", "Breathlessness",
  "Fatigue", "Nausea", "Rash", "Sore Throat", "Body Aches",
  "Dizziness", "Abdominal Pain", "Diarrhea", "Vomiting", "Loss of Taste/Smell",
];

type Priority = "Normal" | "Urgent" | "Critical";

interface DiagnosisResult {
  disease: string;
  department: string;
  priority: Priority;
  description: string;
}

const rules: { symptoms: string[]; result: DiagnosisResult }[] = [
  { symptoms: ["Chest Pain", "Breathlessness"], result: { disease: "Possible Cardiac Issue", department: "Cardiology", priority: "Critical", description: "Seek immediate medical attention. Chest pain with breathlessness may indicate a cardiac emergency." } },
  { symptoms: ["Fever", "Cough", "Loss of Taste/Smell"], result: { disease: "Possible COVID-19", department: "Pulmonology", priority: "Urgent", description: "Isolate and get tested. Monitor oxygen levels closely." } },
  { symptoms: ["Fever", "Rash"], result: { disease: "Possible Dengue", department: "General Medicine", priority: "Urgent", description: "Get a platelet count test. Stay hydrated and monitor for warning signs." } },
  { symptoms: ["Fever", "Cough"], result: { disease: "Flu / Upper Respiratory Infection", department: "General Medicine", priority: "Normal", description: "Rest, stay hydrated. Consult if symptoms persist beyond 3 days." } },
  { symptoms: ["Headache", "Dizziness", "Nausea"], result: { disease: "Possible Migraine / Vertigo", department: "Neurology", priority: "Urgent", description: "Avoid screens and bright lights. Consult a neurologist if recurring." } },
  { symptoms: ["Abdominal Pain", "Vomiting", "Diarrhea"], result: { disease: "Gastroenteritis", department: "Gastroenterology", priority: "Normal", description: "Stay hydrated with ORS. Avoid heavy foods." } },
  { symptoms: ["Fever", "Body Aches", "Fatigue"], result: { disease: "Viral Fever", department: "General Medicine", priority: "Normal", description: "Rest and take prescribed medication. Monitor temperature." } },
  { symptoms: ["Sore Throat", "Cough", "Fever"], result: { disease: "Pharyngitis / Tonsillitis", department: "ENT", priority: "Normal", description: "Gargle with warm salt water. Consult if swallowing is difficult." } },
];

const priorityConfig: Record<Priority, { color: string }> = {
  Normal: { color: "bg-success text-success-foreground" },
  Urgent: { color: "bg-warning text-warning-foreground" },
  Critical: { color: "bg-destructive text-destructive-foreground" },
};

const SymptomChecker = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
    setResult(null);
  };

  const analyze = () => {
    if (selected.length === 0) return;

    // Find best matching rule
    let bestMatch: DiagnosisResult | null = null;
    let bestScore = 0;

    for (const rule of rules) {
      const matches = rule.symptoms.filter((s) => selected.includes(s)).length;
      const score = matches / rule.symptoms.length;
      if (score >= 1 && matches > bestScore) {
        bestMatch = rule.result;
        bestScore = matches;
      }
    }

    if (!bestMatch) {
      // Partial match
      for (const rule of rules) {
        const matches = rule.symptoms.filter((s) => selected.includes(s)).length;
        if (matches > bestScore) {
          bestMatch = rule.result;
          bestScore = matches;
        }
      }
    }

    setResult(bestMatch || {
      disease: "General Consultation Recommended",
      department: "General Medicine",
      priority: "Normal",
      description: "Your symptoms don't match a specific pattern. We recommend a general consultation.",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">AI Symptom Checker</h1>
        <p className="mt-1 text-muted-foreground">Select your symptoms for a preliminary assessment</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Select Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {symptomsList.map((symptom) => (
                  <label
                    key={symptom}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all text-sm ${
                      selected.includes(symptom)
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Checkbox
                      checked={selected.includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    {symptom}
                  </label>
                ))}
              </div>
              <Button
                onClick={analyze}
                disabled={selected.length === 0}
                className="mt-6 w-full gradient-primary text-primary-foreground font-semibold gap-2"
              >
                <Activity className="h-4 w-4" />
                Analyze Symptoms
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <Card className="shadow-elevated animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base">Assessment Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Possible Condition</div>
                  <div className="text-lg font-bold text-foreground">{result.disease}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Priority:</div>
                  <Badge className={priorityConfig[result.priority].color}>
                    {result.priority}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Recommended Department</div>
                  <div className="font-medium text-primary">{result.department}</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  {result.description}
                </div>
                {result.priority === "Critical" && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Seek immediate medical attention!
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 text-center">
              <Stethoscope className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Select symptoms and click analyze to get your assessment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
