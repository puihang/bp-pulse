import { useMemo } from 'react';
import { WheelPicker } from './WheelPicker';
import { Label } from '@/components/ui/label';

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export const DateTimePicker = ({ date, time, onDateChange, onTimeChange }: DateTimePickerProps) => {
  // Parse current date value (format: "M/D")
  const [currentMonth, currentDay] = useMemo(() => {
    const parts = date.split('/');
    return [parts[0] || '1', parts[1] || '1'];
  }, [date]);

  // Parse current time value (format: "H:MM")
  const [currentHour, currentMinute] = useMemo(() => {
    const parts = time.split(':');
    return [parts[0] || '0', parts[1] || '00'];
  }, [time]);

  // Generate options
  const months = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => String(i + 1)), []
  );
  
  const days = useMemo(() => 
    Array.from({ length: 31 }, (_, i) => String(i + 1)), []
  );
  
  const hours = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => String(i)), []
  );
  
  const minutes = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []
  );

  const handleMonthChange = (month: string) => {
    onDateChange(`${month}/${currentDay}`);
  };

  const handleDayChange = (day: string) => {
    onDateChange(`${currentMonth}/${day}`);
  };

  const handleHourChange = (hour: string) => {
    onTimeChange(`${hour}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    onTimeChange(`${currentHour}:${minute}`);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Date Picker */}
      <div className="space-y-2">
        <Label>日期</Label>
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-2">
          <WheelPicker
            options={months}
            value={currentMonth}
            onChange={handleMonthChange}
            className="flex-1"
          />
          <span className="text-lg font-medium text-muted-foreground">/</span>
          <WheelPicker
            options={days}
            value={currentDay}
            onChange={handleDayChange}
            className="flex-1"
          />
        </div>
      </div>

      {/* Time Picker */}
      <div className="space-y-2">
        <Label>時間</Label>
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-2">
          <WheelPicker
            options={hours}
            value={currentHour}
            onChange={handleHourChange}
            className="flex-1"
          />
          <span className="text-lg font-medium text-muted-foreground">:</span>
          <WheelPicker
            options={minutes}
            value={currentMinute}
            onChange={handleMinuteChange}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
