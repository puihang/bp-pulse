import { supabase } from '@/integrations/supabase/client';

export interface BloodPressureRecord {
  email: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  rowIndex?: number;
}

export const fetchRecords = async (email: string): Promise<BloodPressureRecord[]> => {
  const { data, error } = await supabase.functions.invoke('google-sheets', {
    body: { action: 'fetch', email },
  });

  if (error) {
    console.error('Error fetching records:', error);
    throw new Error('無法載入記錄');
  }

  if (!data.success) {
    throw new Error(data.error || '無法載入記錄');
  }

  return data.records;
};

export const addRecord = async (record: Omit<BloodPressureRecord, 'rowIndex'>): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('google-sheets', {
    body: { action: 'add', data: record },
  });

  if (error) {
    console.error('Error adding record:', error);
    throw new Error('無法新增記錄');
  }

  if (!data.success) {
    throw new Error(data.error || '無法新增記錄');
  }
};

export const updateRecord = async (rowIndex: number, record: Omit<BloodPressureRecord, 'rowIndex'>): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('google-sheets', {
    body: { action: 'update', rowIndex, data: record },
  });

  if (error) {
    console.error('Error updating record:', error);
    throw new Error('無法更新記錄');
  }

  if (!data.success) {
    throw new Error(data.error || '無法更新記錄');
  }
};

export const deleteRecord = async (rowIndex: number): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('google-sheets', {
    body: { action: 'delete', rowIndex },
  });

  if (error) {
    console.error('Error deleting record:', error);
    throw new Error('無法刪除記錄');
  }

  if (!data.success) {
    throw new Error(data.error || '無法刪除記錄');
  }
};
