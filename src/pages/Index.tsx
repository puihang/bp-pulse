import { useApp } from '@/components/AppProvider';
import { BloodPressureForm } from '@/components/BloodPressureForm';

const Index = () => {
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

export default Index;
