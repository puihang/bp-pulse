import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { BloodPressureRecord } from '@/lib/googleSheets';

interface Props {
  records: BloodPressureRecord[];
  onEdit: (record: BloodPressureRecord) => void;
  onDelete: (record: BloodPressureRecord) => void;
  canEdit: boolean;
}

const getBloodPressureStatus = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80) {
    return { label: '正常', color: 'text-green-600 bg-green-100' };
  } else if (systolic < 130 && diastolic < 80) {
    return { label: '偏高', color: 'text-yellow-600 bg-yellow-100' };
  } else if (systolic < 140 || diastolic < 90) {
    return { label: '高血壓前期', color: 'text-orange-600 bg-orange-100' };
  } else {
    return { label: '高血壓', color: 'text-red-600 bg-red-100' };
  }
};

export const RecordsTable = ({ records, onEdit, onDelete, canEdit }: Props) => {
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
            <TableHead className="text-center">上壓</TableHead>
            <TableHead className="text-center">下壓</TableHead>
            <TableHead className="text-center">脈搏</TableHead>
            <TableHead className="text-center">狀態</TableHead>
            {canEdit && <TableHead className="text-right">操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => {
            const status = getBloodPressureStatus(record.systolic, record.diastolic);
            return (
              <TableRow key={index}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.time}</TableCell>
                <TableCell className="text-center font-medium">{record.systolic}</TableCell>
                <TableCell className="text-center font-medium">{record.diastolic}</TableCell>
                <TableCell className="text-center">{record.pulse}</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </TableCell>
                {canEdit && (
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
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
