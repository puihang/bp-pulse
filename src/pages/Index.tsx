import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BloodPressureForm } from '@/components/BloodPressureForm';
import { RecordsTable } from '@/components/RecordsTable';
import {
  fetchRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  type BloodPressureRecord,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Heart, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Index = () => {
  const [phone, setPhone] = useState(() => localStorage.getItem('userPhone') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('userPhone'));
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BloodPressureRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<BloodPressureRecord | null>(null);
  const { toast } = useToast();

  const loadRecords = async () => {
    if (!phone) return;
    setIsLoading(true);
    try {
      const data = await fetchRecords(phone);
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
    } catch (error) {
      toast({ title: '更新失敗', description: String(error), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord?.rowIndex) return;
    try {
      await deleteRecord(deletingRecord.rowIndex);
      toast({ title: '刪除成功' });
      setDeletingRecord(null);
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span className="font-semibold text-rose-900">血壓記錄</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{phone}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {editingRecord ? (
          <BloodPressureForm
            userPhone={phone}
            initialData={editingRecord}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRecord(null)}
            isEdit
          />
        ) : (
          <BloodPressureForm userPhone={phone} onSubmit={handleAdd} />
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">我的記錄</CardTitle>
            <Button variant="outline" size="sm" onClick={loadRecords} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </CardHeader>
          <CardContent>
            <RecordsTable
              records={records}
              onEdit={setEditingRecord}
              onDelete={setDeletingRecord}
            />
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這筆記錄嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
