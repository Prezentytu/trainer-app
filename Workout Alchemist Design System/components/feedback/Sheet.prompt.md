Bottom sheet by default, centred dialog with `center`. Escape closes.

```jsx
<Sheet open={open} onClose={close} title="Dodaj ćwiczenie">…</Sheet>
<Sheet center open={confirm} onClose={no} title="Usunąć trening?"
  footer={<><Button variant="outline" full>Anuluj</Button><Button variant="danger" full>Usuń</Button></>} />
```

This is the only overlay in the system — there are no toasts, tooltips or popovers.
