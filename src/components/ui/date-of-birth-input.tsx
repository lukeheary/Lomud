import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateOfBirthInputProps = {
  label?: string;
  required?: boolean;
  day: string;
  month: string;
  year: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  helperText?: string;
  disabled?: boolean;
};

export function DateOfBirthInput({
  label = "Date of Birth",
  required = false,
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
  disabled = false,
}: DateOfBirthInputProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          id="dob-month"
          inputMode="numeric"
          placeholder="MM"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          maxLength={2}
          disabled={disabled}
        />
        <Input
          id="dob-day"
          inputMode="numeric"
          placeholder="DD"
          value={day}
          onChange={(e) => onDayChange(e.target.value)}
          maxLength={2}
          disabled={disabled}
        />
        <Input
          id="dob-year"
          inputMode="numeric"
          placeholder="YYYY"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          maxLength={4}
          disabled={disabled}
        />
      </div>
      {/*<p className="text-xs text-muted-foreground">{helperText}</p>*/}
    </div>
  );
}
