"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UserCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    city: "",
    state: "",
  });
  const [searchCity, setSearchCity] = useState("");

  const updateUserMutation = trpc.user.updateUsername.useMutation({
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully",
      });
      router.push("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 0) {
      // Username step
      if (!formData.username) {
        toast({
          title: "Validation Error",
          description: "Please enter a username",
          variant: "destructive",
        });
        return;
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        toast({
          title: "Invalid Username",
          description: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
          variant: "destructive",
        });
        return;
      }

      // Move to next step
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // City step
      if (!formData.city || !formData.state) {
        toast({
          title: "Validation Error",
          description: "Please select your city",
          variant: "destructive",
        });
        return;
      }

      // Submit both username and location
      updateUserMutation.mutate({
        username: formData.username,
        city: formData.city,
        state: formData.state,
      });
    }
  };

  const handleCitySelect = useCallback((place: {
    name: string;
    address: string;
    city: string;
    state: string;
    formattedAddress: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      city: place.city,
      state: place.state,
    }));
    setSearchCity(place.city);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Define onboarding steps - easily extensible
  const steps = [
    {
      title: "Choose Your Username",
      description: "This is how other users will find and identify you",
      icon: UserCircle,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value.toLowerCase() })
              }
              placeholder="johndoe"
              autoComplete="off"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "What City Are You In?",
      description: "Help us show you local events in your area",
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <GooglePlacesAutocomplete
              value={searchCity}
              onChange={setSearchCity}
              onPlaceSelect={handleCitySelect}
              placeholder="Search for your city..."
              searchType="cities"
            />
            <p className="text-xs text-muted-foreground">
              Start typing your city name
            </p>
          </div>
          {formData.city && formData.state && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">
                Selected: {formData.city}, {formData.state}
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
          {steps.length > 1 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
              <div className="mt-2 flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStepData.content}

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={updateUserMutation.isPending}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                {updateUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLastStep ? "Complete Setup" : "Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
