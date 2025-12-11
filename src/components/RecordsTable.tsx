import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { BloodPressureRecord } from '@/lib/api';

interface Props {
  records: BloodPressureRecord[];
  onEdit: (record: BloodPressureRecord) => void;
  onDelete: (record: BloodPressureRecord) => void;
}

export const RecordsTable = ({ records, onEdit, onDelete }: Props) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暫無記錄
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>時間</TableHead>
            <TableHead className="text-center">上/下壓</TableHead>
            <TableHead className="text-center">脈搏</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.time}</TableCell>
                <TableCell className="text-center font-medium">{record.systolic}/{record.diastolic}</TableCell>
                <TableCell className="text-center">{record.pulse}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};