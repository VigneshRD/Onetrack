import React from 'react';
import { Modal, Text, BlockStack } from '@shopify/polaris';

export function ConfirmationModal({ 
    open, 
    title, 
    message, 
    onConfirm, 
    onCancel,
    confirmText = "Yes",
    cancelText = "No",
    destructive = false 
}) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            primaryAction={{
                content: confirmText,
                onAction: onConfirm,
                destructive: destructive
            }}
            secondaryActions={[
                {
                    content: cancelText,
                    onAction: onCancel
                }
            ]}
        >
            <Modal.Section>
                <Text as="p">{message}</Text>
            </Modal.Section>
        </Modal>
    );
}

export function AlertModal({ 
    open, 
    title, 
    message, 
    onClose,
    type = "info" // "info", "success", "error"
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            primaryAction={{
                content: "OK",
                onAction: onClose
            }}
        >
            <Modal.Section>
                <Text as="p">{message}</Text>
            </Modal.Section>
        </Modal>
    );
}

// Helper hook for managing alerts
export function useAlert() {
    const [alert, setAlert] = React.useState({ open: false, title: '', message: '', type: 'info' });

    const showAlert = (message, title = "Alert", type = "info") => {
        setAlert({ open: true, title, message, type });
    };

    const showSuccess = (message, title = "Success") => {
        showAlert(message, title, "success");
    };

    const showError = (message, title = "Error") => {
        showAlert(message, title, "error");
    };

    const closeAlert = () => {
        setAlert({ ...alert, open: false });
    };

    const AlertComponent = () => (
        <AlertModal
            open={alert.open}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            onClose={closeAlert}
        />
    );

    return {
        showAlert,
        showSuccess,
        showError,
        AlertComponent
    };
}

// Helper hook for managing confirmations
export function useConfirm() {
    const [confirm, setConfirm] = React.useState({ 
        open: false, 
        title: '', 
        message: '', 
        onConfirm: null,
        destructive: false 
    });

    const showConfirm = (message, title = "Are you sure?", destructive = false) => {
        return new Promise((resolve) => {
            setConfirm({ 
                open: true, 
                title, 
                message, 
                destructive,
                onConfirm: () => {
                    setConfirm({ ...confirm, open: false });
                    resolve(true);
                }
            });
        });
    };

    const closeConfirm = () => {
        setConfirm({ ...confirm, open: false });
    };

    const ConfirmComponent = () => (
        <ConfirmationModal
            open={confirm.open}
            title={confirm.title}
            message={confirm.message}
            destructive={confirm.destructive}
            onConfirm={confirm.onConfirm}
            onCancel={closeConfirm}
        />
    );

    return {
        showConfirm,
        ConfirmComponent
    };
}