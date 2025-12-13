import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { Heart, LogOut } from 'lucide-react';
import {
  fetchRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  type BloodPressureRecord,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  phone: string;
  records: BloodPressureRecord[];
  isLoading: boolean;
  editingRecord: BloodPressureRecord | null;
  setEditingRecord: (record: BloodPressureRecord | null) => void;
  loadRecords: () => Promise<void>;
  handleAdd: (data: Omit<BloodPressureRecord, 'rowIndex'>) => Promise<void>;
  handleUpdate: (data: Omit<BloodPressureRecord, 'rowIndex'>) => Promise<void>;
  handleDelete: (rowIndex: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppLayout');
  return context;
};

interface Props {
  children: ReactNode;
  title: string;
}

export const AppLayout = ({ children, title }: Props) => {
  const [phone, setPhone] = useState(() => localStorage.getItem('userPhone') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('userPhone'));
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BloodPressureRecord | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadRecords = async () => {
    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone) return;
    setIsLoading(true);
    try {
      const data = await fetchRecords(userPhone);
      setRecords(data.sort((a, b) => {
        const dateA = a.date + ' ' + a.time;
        const dateB = b.date + ' ' + b.time;
        return dateB.localeCompare(dateA);
      }));
    } catch (error) {
      toast({ title: '載入失敗', description: String(error), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadRecords();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^[0-9]{8,}$/;
    if (phoneRegex.test(phone.replace(/\D/g, ''))) {
      localStorage.setItem('userPhone', phone);
      setIsLoggedIn(true);
    } else {
      toast({ title: '請輸入有效的電話號碼（至少8位數字）', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    setPhone('');
    setIsLoggedIn(false);
    setRecords([]);
    navigate('/');
  };

  const handleAdd = async (data: Omit<BloodPressureRecord, 'rowIndex'>) => {
    try {
      await addRecord(data);
      toast({ title: '新增成功' });
      setTimeout(loadRecords, 1000);
    } catch (error) {
      toast({ title: '新增失敗', description: String(error), variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: Omit<BloodPressureRecord, 'rowIndex'>) => {
    if (!editingRecord?.rowIndex) return;
    try {
      await updateRecord(editingRecord.rowIndex, data);
      toast({ title: '更新成功' });
      setEditingRecord(null);
      setTimeout(loadRecords, 1000);
      navigate('/records');
    } catch (error) {
      toast({ title: '更新失敗', description: String(error), variant: 'destructive' });
    }
  };

  const handleDelete = async (rowIndex: number) => {
    try {
      await deleteRecord(rowIndex);
      toast({ title: '刪除成功' });
      setTimeout(loadRecords, 1000);
    } catch (error) {
      toast({ title: '刪除失敗', description: String(error), variant: 'destructive' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <CardTitle className="text-2xl">血壓記錄</CardTitle>
            <p className="text-muted-foreground">請輸入電話號碼登入</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="12345678"
                required
                className="text-center"
              />
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600">
                登入
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      phone,
      records,
      isLoading,
      editingRecord,
      setEditingRecord,
      loadRecords,
      handleAdd,
      handleUpdate,
      handleDelete,
    }}>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white pb-16">
        <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-3xl">
            <h1 className="font-semibold text-rose-900">{title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{phone}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="h-4 w-4" />
                登出
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-3xl">
          {children}
        </main>

        <BottomNav />
      </div>
    </AppContext.Provider>
  );
};
