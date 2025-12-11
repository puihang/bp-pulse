import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BloodPressureForm } from '@/components/BloodPressureForm';
import { RecordsTable } from '@/components/RecordsTable';
import { SetupGuide } from '@/components/SetupGuide';
import {
  fetchRecordsByEmail,
  addRecord,
  updateRecord,
  deleteRecord,
  getAppsScriptUrl,
  type BloodPressureRecord,
} from '@/lib/googleSheets';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Settings, Heart } from 'lucide-react';
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
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('userEmail'));
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BloodPressureRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<BloodPressureRecord | null>(null);
  const [showSetup, setShowSetup] = useState(() => !getAppsScriptUrl());
  const { toast } = useToast();

  const loadRecords = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const data = await fetchRecordsByEmail(email);
      setRecords(data.sort((a, b) => {
        // Sort by date and time descending
        const dateA = a.date + ' ' + a.time;
        const dateB = b.date + ' ' + b.time;
        return dateB.localeCompare(dateA);
      }));
    } catch (error) {
      toast({ title: '載入失敗', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !showSetup) {
      loadRecords();
    }
  }, [isLoggedIn, showSetup]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      localStorage.setItem('userEmail', email);
      setIsLoggedIn(true);
    } else {
      toast({ title: '請輸入有效的電郵地址', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setEmail('');
    setIsLoggedIn(false);
    setRecords([]);
  };

  const handleAdd = async (data: Omit<BloodPressureRecord, 'rowIndex'>) => {
    try {
      await addRecord(data);
      toast({ title: '新增成功' });
      // Wait a bit for Google Sheet to update
      setTimeout(loadRecords, 1500);
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
      setTimeout(loadRecords, 1500);
    } catch (error) {
      toast({ title: '更新失敗', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord?.rowIndex) return;
    try {
      await deleteRecord(deletingRecord.rowIndex);
      toast({ title: '刪除成功' });
      setDeletingRecord(null);
      setTimeout(loadRecords, 1500);
    } catch (error) {
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 py-8">
        <SetupGuide onComplete={() => setShowSetup(false)} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>血壓記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入電郵地址"
                required
              />
              <Button type="submit" className="w-full">
                進入
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">血壓記錄</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{email}</span>
            <Button variant="ghost" size="icon" onClick={() => setShowSetup(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {editingRecord ? (
          <BloodPressureForm
            userEmail={email}
            initialData={editingRecord}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRecord(null)}
            isEdit
          />
        ) : (
          <BloodPressureForm userEmail={email} onSubmit={handleAdd} />
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
              canEdit={!!getAppsScriptUrl()}
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
            <AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
