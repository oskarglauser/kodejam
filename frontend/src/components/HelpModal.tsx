import { ModalOverlay, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody } from './ui/modal'

interface HelpModalProps {
  onClose: () => void
}

const KBD_CLASSES = 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-secondary text-muted-foreground rounded border border-border/60'

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className={KBD_CLASSES}>{children}</kbd>
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent className="w-[520px]">
        <ModalHeader>
          <ModalTitle>Help</ModalTitle>
          <ModalClose onClick={onClose} />
        </ModalHeader>

        <ModalBody className="flex flex-col gap-5 text-[13px] text-foreground/90">
          {/* Workflow */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow</h3>
            <ol className="space-y-1 list-decimal list-inside marker:text-muted-foreground/50 marker:font-medium leading-relaxed">
              <li>Create pages in the sidebar to organize your screens and flows</li>
              <li>Use the canvas tools to sketch wireframes or add sticky notes</li>
              <li>Open the chat panel to describe what you want built</li>
              <li>Select shapes on the canvas to give Claude visual context</li>
              <li>Review the build plan, then let Claude write the code into your repo</li>
              <li>Set a dev URL in settings to capture live screenshots from your app</li>
            </ol>
          </section>

          {/* Canvas tools */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Canvas tools</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <Row kbd="V">Select &amp; move elements</Row>
              <Row kbd="H">Pan the canvas</Row>
              <Row kbd="B">Add a wireframe box</Row>
              <Row kbd="N">Add a sticky note</Row>
              <Row kbd="D">Freehand draw</Row>
              <Row kbd="A">Draw an arrow</Row>
              <Row kbd="T">Add text</Row>
              <Row kbd="E">Eraser</Row>
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shortcuts</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <Row kbd="Ctrl+Z">Undo</Row>
              <Row kbd="Ctrl+Shift+Z">Redo</Row>
              <Row kbd="Ctrl+A">Select all</Row>
              <Row kbd="Delete">Delete selected</Row>
              <Row kbd="Ctrl+D">Duplicate</Row>
              <Row kbd="Ctrl+C / V">Copy &amp; paste</Row>
              <Row kbd="Scroll">Zoom in / out</Row>
              <Row kbd="Space+Drag">Pan canvas</Row>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tips</h3>
            <ul className="space-y-1 list-disc list-inside marker:text-muted-foreground/50 leading-relaxed">
              <li>Double-click the project name in the toolbar to rename it</li>
              <li>Double-click a page in the sidebar to rename it</li>
              <li>Select shapes before chatting to give the AI visual context</li>
              <li>Set a dev server URL in project settings to enable live screenshots</li>
            </ul>
          </section>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}

function Row({ kbd, children }: { kbd: string; children: React.ReactNode }) {
  const keys = kbd.split('+')
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-foreground/80">{children}</span>
      <span className="flex items-center gap-0.5 shrink-0">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-muted-foreground/40 text-[10px]">+</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </span>
    </div>
  )
}
