import { AppLayout, useApp } from '@/components/AppLayout';
import { BloodPressureForm } from '@/components/BloodPressureForm';

const IndexContent = () => {
  const { phone, editingRecord, setEditingRecord, handleAdd, handleUpdate } = useApp();

  return editingRecord ? (
    <BloodPressureForm
      userPhone={phone}
      initialData={editingRecord}
      onSubmit={handleUpdate}
      onCancel={() => setEditingRecord(null)}
      isEdit
    />
  ) : (
    <BloodPressureForm userPhone={phone} onSubmit={handleAdd} />
  );
};

const Index = () => {
  return (
    <AppLayout title="新增記錄">
      <IndexContent />
    </AppLayout>
  );
};

export default Index;
