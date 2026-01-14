"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSlug, US_STATES } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

export default function NewBusinessPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    address: "",
    city: "",
    state: "",
    website: "",
    instagram: "",
  });

  const createMutation = trpc.business.createBusiness.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Business created successfully",
      });
      router.push(`/business/${data.slug}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.city || !formData.state) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      address: formData.address || undefined,
      city: formData.city,
      state: formData.state,
      website: formData.website || undefined,
      instagram: formData.instagram || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <CardTitle className="text-2xl">Add New Business</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Create a business profile to start posting events
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="The Coffee Shop"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="the-coffee-shop"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your business will be available at /business/{formData.slug || "your-slug"}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Tell people about your business..."
                rows={4}
              />
            </div>

            {/* Business Image */}
            <div className="space-y-2">
              <Label>Business Image</Label>
              {formData.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={formData.imageUrl}
                    alt="Business image"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Upload an image for your business
                    </p>
                    <UploadButton
                      endpoint="businessImage"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setFormData({ ...formData, imageUrl: res[0].url });
                          toast({
                            title: "Success",
                            description: "Image uploaded successfully",
                          });
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          title: "Upload failed",
                          description: error.message,
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main Street"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="San Francisco"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) =>
                    setFormData({ ...formData, state: value })
                  }
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  placeholder="yourbusiness"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Business
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
