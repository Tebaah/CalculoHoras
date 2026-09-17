/**
 * confirmModal.js - Componente de diálogo modal de confirmación
 *
 * Muestra un modal accesible basado en el elemento nativo <dialog> con un
 * mensaje y dos acciones (confirmar / cancelar), resolviendo una promesa con
 * la decisión del usuario. Se utiliza, por ejemplo, para preguntar si se
 * desea repetir el horario de un día en el día siguiente del reporte semanal.
 */

// Referencias al modal visible actualmente (solo puede haber uno a la vez)
let activeDialog = null;
let activeResolve = null;

/**
 * Cierra y elimina el modal activo resolviendo su promesa como cancelada
 */
function disposeActiveModal() {
    if (!activeDialog) {
        return;
    }

    const dialog = activeDialog;
    const resolve = activeResolve;

    activeDialog = null;
    activeResolve = null;

    if (dialog.open) {
        dialog.close();
    }
    dialog.remove();

    if (resolve) {
        resolve(false);
    }
}

/**
 * Muestra un modal de confirmación y espera la respuesta del usuario
 *
 * @param {Object} options - Opciones del modal
 * @param {string} options.title - Título del modal
 * @param {string} [options.message] - Pregunta o mensaje principal
 * @param {string} [options.detail] - Detalle adicional (ej: horario a repetir)
 * @param {string} [options.confirmText] - Texto del botón de confirmación
 * @param {string} [options.cancelText] - Texto del botón de cancelación
 * @returns {Promise<boolean>} true si el usuario confirma, false si cancela
 */
export function showConfirmModal({
    title = 'Confirmar',
    message = '',
    detail = '',
    confirmText = 'S\u00ED',
    cancelText = 'No',
} = {}) {
    // Respaldo para navegadores sin soporte del elemento <dialog>
    if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) {
        const textoPlano = [message, detail].filter(Boolean).join('\n\n');
        return Promise.resolve(window.confirm(textoPlano));
    }

    // Solo se permite un modal visible a la vez
    disposeActiveModal();

    return new Promise((resolve) => {
        const dialog = document.createElement('dialog');
        dialog.className = 'modal';
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'modalTitle');
        dialog.setAttribute('aria-describedby', 'modalMessage');

        const content = document.createElement('div');
        content.className = 'modal__content';

        const titleEl = document.createElement('h2');
        titleEl.className = 'modal__title';
        titleEl.id = 'modalTitle';
        titleEl.textContent = title;

        const messageEl = document.createElement('p');
        messageEl.className = 'modal__message';
        messageEl.id = 'modalMessage';
        messageEl.textContent = message;

        content.appendChild(titleEl);
        content.appendChild(messageEl);

        if (detail) {
            const detailEl = document.createElement('p');
            detailEl.className = 'modal__detail';
            detailEl.textContent = detail;
            content.appendChild(detailEl);
        }

        const actions = document.createElement('div');
        actions.className = 'modal__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'modal__btn modal__btn--secondary';
        cancelBtn.textContent = cancelText;

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'modal__btn modal__btn--primary';
        confirmBtn.textContent = confirmText;

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        content.appendChild(actions);
        dialog.appendChild(content);
        document.body.appendChild(dialog);

        let settled = false;

        const closeWith = (value) => {
            if (settled) {
                return;
            }
            settled = true;

            activeDialog = null;
            activeResolve = null;

            if (dialog.open) {
                dialog.close();
            }
            dialog.remove();

            resolve(value);
        };

        confirmBtn.addEventListener('click', () => closeWith(true));
        cancelBtn.addEventListener('click', () => closeWith(false));

        // Cerrar con Escape sigue la convención del navegador: equivale a cancelar
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeWith(false);
        });

        // Clic fuera del cuadro de diálogo (::backdrop) equivale a cancelar
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) {
                closeWith(false);
            }
        });

        dialog.addEventListener('close', () => closeWith(false));

        activeDialog = dialog;
        activeResolve = resolve;

        dialog.showModal();
        confirmBtn.focus();
    });
}
