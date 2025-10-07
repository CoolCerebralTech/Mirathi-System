// FILE: src/pages/WillDetailPage.tsx (Updated)

// ... (keep all existing imports)
import { useState } from 'react'; // Add useState
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '../components/common/Modal'; // Import Modal components
import { BeneficiaryAssignmentForm } from '../features/wills/components/BeneficiaryAssignmentForm'; // Import the new form


export function WillDetailPage() {
  const { id: willId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Add state to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... (keep all existing hooks: useWill, useActivateWill, etc.)
  const { data: will, isLoading, isError } = useWill(willId!);
  const activateWillMutation = useActivateWill();
  const removeAssignmentMutation = useRemoveBeneficiaryAssignment();
  
  // ... (keep existing handler functions: handleActivate, handleDeleteAssignment)
  const handleActivate = () => { /* ... */ };
  const handleDeleteAssignment = (assignmentId: string) => { /* ... */ };


  if (isLoading) { /* ... */ }
  if (isError || !will) { /* ... */ }

  const canBeActivated = will.status === 'DRAFT' && will.beneficiaryAssignments.length > 0;
  const isEditable = will.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={will.title}
        // ... (rest of PageHeader props)
      />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Beneficiary Assignments</CardTitle>
            {isEditable && (
              // --- THIS IS THE CHANGE ---
              // This button will now open the modal
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <BeneficiaryAssignmentsTable
            assignments={will.beneficiaryAssignments}
            onDelete={handleDeleteAssignment}
          />
        </CardContent>
      </Card>

      {/* --- ADD THIS MODAL AT THE END --- */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add New Assignment</ModalTitle>
          </ModalHeader>
          {/* Render the form only when the modal is open to ensure fresh data */}
          {isModalOpen && (
              <BeneficiaryAssignmentForm 
                willId={willId!}
                onSuccess={() => setIsModalOpen(false)} 
              />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}