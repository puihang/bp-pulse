import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout, useApp } from '@/components/AppLayout';
import { RecordsTable } from '@/components/RecordsTable';
import { RefreshCw } from 'lucide-react';
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
import type { BloodPressureRecord } from '@/lib/api';

const RecordsContent = () => {
  const { records, isLoading, loadRecords, setEditingRecord, handleDelete } = useApp();
  const [deletingRecord, setDeletingRecord] = useState<BloodPressureRecord | null>(null);
  const navigate = useNavigate();

  const onEdit = (record: BloodPressureRecord) => {
    setEditingRecord(record);
    navigate('/');
  };

  const onConfirmDelete = async () => {
    if (deletingRecord?.rowIndex) {
      await handleDelete(deletingRecord.rowIndex);
      setDeletingRecord(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">記錄列表</CardTitle>
          <Button variant="outline" size="sm" onClick={loadRecords} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={records}
            onEdit={onEdit}
            onDelete={setDeletingRecord}
          />
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={onConfirmDelete} className="bg-rose-500 hover:bg-rose-600">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Records = () => {
  return (
    <AppLayout title="我的記錄">
      <RecordsContent />
    </AppLayout>
  );
};

export default Records;
