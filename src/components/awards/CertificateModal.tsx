import React from 'react';
import { LiteracyAward, Student } from '../../types';
import { CertificateStudioModal } from './CertificateStudioModal';

interface CertificateModalProps {
  award: LiteracyAward;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  award,
  student,
  isOpen,
  onClose
}) => {
  return (
    <CertificateStudioModal
      isOpen={isOpen}
      onClose={onClose}
      initialStudent={student}
      initialAward={award}
    />
  );
};

