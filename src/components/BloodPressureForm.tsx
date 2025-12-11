import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BloodPressureRecord } from '@/lib/api';

interface Props {
  userPhone: string;
  initialData?: BloodPressureRecord;
  onSubmit: (data: Omit<BloodPressureRecord, 'rowIndex'>) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: `${monthNames[now.getMonth()]} ${now.getDate()}`,
    time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  };
};

export const BloodPressureForm = ({ userPhone, initialData, onSubmit, onCancel, isEdit }: Props) => {
  const { date: defaultDate, time: defaultTime } = getCurrentDateTime();
  const [date, setDate] = useState(initialData?.date || defaultDate);
  const [time, setTime] = useState(initialData?.time || defaultTime);
  const [systolic, setSystolic] = useState(initialData?.systolic?.toString() || '');
  const [diastolic, setDiastolic] = useState(initialData?.diastolic?.toString() || '');
  const [pulse, setPulse] = useState(initialData?.pulse?.toString() || '');
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
        setSystolic('');
        setDiastolic('');
        setPulse('');
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Dec 11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">時間</Label>
              <Input
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="20:00"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic">上壓</Label>
              <Input
                id="systolic"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                required
                min={60}
                max={250}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic">下壓</Label>
              <Input
                id="diastolic"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                required
                min={40}
                max={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pulse">脈搏</Label>
              <Input
                id="pulse"
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="70"
                required
                min={40}
                max={200}
              />
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
