import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/DateTimePicker';
import { WheelPicker } from '@/components/WheelPicker';
import type { BloodPressureRecord } from '@/lib/api';

interface Props {
  userPhone: string;
  initialData?: BloodPressureRecord;
  onSubmit: (data: Omit<BloodPressureRecord, 'rowIndex'>) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`,
    time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  };
};

// Generate number options for wheel pickers
const systolicOptions = Array.from({ length: 141 }, (_, i) => String(60 + i)); // 60-200
const diastolicOptions = Array.from({ length: 101 }, (_, i) => String(40 + i)); // 40-140
const pulseOptions = Array.from({ length: 161 }, (_, i) => String(40 + i)); // 40-200

export const BloodPressureForm = ({ userPhone, initialData, onSubmit, onCancel, isEdit }: Props) => {
  const { date: defaultDate, time: defaultTime } = getCurrentDateTime();
  const [date, setDate] = useState(initialData?.date || defaultDate);
  const [time, setTime] = useState(initialData?.time || defaultTime);
  const [systolic, setSystolic] = useState(initialData?.systolic?.toString() || '105');
  const [diastolic, setDiastolic] = useState(initialData?.diastolic?.toString() || '70');
  const [pulse, setPulse] = useState(initialData?.pulse?.toString() || '75');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({
        phone: userPhone,
        date,
        time,
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: parseInt(pulse),
      });
      if (!isEdit) {
        // Reset to current time after adding
        const { date: newDate, time: newTime } = getCurrentDateTime();
        setDate(newDate);
        setTime(newTime);
        setSystolic('105');
        setDiastolic('70');
        setPulse('75');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isEdit ? '編輯記錄' : '新增血壓記錄'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DateTimePicker
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>上/下壓</Label>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-2">
                <WheelPicker
                  options={systolicOptions}
                  value={systolic}
                  onChange={setSystolic}
                  className="flex-1"
                />
                <span className="text-lg font-medium text-muted-foreground">/</span>
                <WheelPicker
                  options={diastolicOptions}
                  value={diastolic}
                  onChange={setDiastolic}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>脈搏</Label>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-2">
                <WheelPicker
                  options={pulseOptions}
                  value={pulse}
                  onChange={setPulse}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? '處理中...' : isEdit ? '更新' : '新增'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
