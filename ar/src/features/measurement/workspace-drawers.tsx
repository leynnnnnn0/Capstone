import { ArrowLeft, BookmarkCheck, ScanLine, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import { formatQuoteCurrency } from "./quote-handoff";
import type {
  ModelCategory,
  ModelCategoryId,
  ModelDefinition,
} from "./model-catalog";
import {
  ArProductDrawerDetail,
  ModelCatalogPanel,
} from "./workspace-components";
import type { V2PlacedObject } from "./workspace-types";
import type {
  QuoteDraftSaveState,
  SummaryQuoteItem,
} from "./workspace-types";

interface QuoteSummaryDrawerProps {
  open: boolean;
  items: SummaryQuoteItem[];
  estimatedTotal: number;
  draftState: QuoteDraftSaveState;
  onOpenChange: (open: boolean) => void;
  onPointerDown: () => void;
  onEditItem: (id: number) => void;
  onSaveDraft: () => void;
  onProceed: () => void;
}

export function QuoteSummaryDrawer({
  open,
  items,
  estimatedTotal,
  draftState,
  onOpenChange,
  onPointerDown,
  onEditItem,
  onSaveDraft,
  onProceed,
}: QuoteSummaryDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="grid gap-4 ar-quote-drawer"
        data-xr-ui="true"
        onPointerDown={onPointerDown}
      >
        <DrawerHeader className="ar-drawer-header">
          <div>
            <p className="ar-drawer-eyebrow">Project estimate</p>
            <DrawerTitle>Quote Summary</DrawerTitle>
            <DrawerDescription>
              Tap an AR item to go back and modify it.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ar-drawer-close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </DrawerHeader>

        <div className="summary-card">
          <div className="summary-list">
            {items.length === 0 ? (
              <div className="summary-empty">No objects captured yet.</div>
            ) : (
              items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="summary-item-button"
                  onClick={() => onEditItem(item.id)}
                >
                  <span className="summary-item-copy">
                    <strong>{item.label}</strong>
                    <small>
                      {item.id > 0 ? "AR measured item" : "Selected product"}
                    </small>
                    <p>{item.dimensionsText}</p>
                    <p>1 pc</p>
                  </span>
                  <strong className="summary-item-price">
                    {item.price == null
                      ? "Price pending"
                      : formatQuoteCurrency(item.price)}
                  </strong>
                </button>
              ))
            )}
          </div>

          <div className="summary-total">
            <strong>Estimated Total</strong>
            <span>{formatQuoteCurrency(estimatedTotal)}</span>
          </div>

          <section className="measurement-save-panel" aria-labelledby="quote-save-title">
            <div className="measurement-save-heading">
              <BookmarkCheck className="size-5" aria-hidden="true" />
              <div>
                <strong id="quote-save-title">Save quotation</strong>
                <span>Keep this draft on this device</span>
              </div>
            </div>

            <p className="measurement-save-disclaimer">
              Save the selected products and AR measurements so you can return
              later without measuring everything again.
            </p>

            {draftState.phase === "saved" && (
              <p className="measurement-save-status is-saved" role="status">
                Quotation saved with {draftState.itemCount} item
                {draftState.itemCount === 1 ? "" : "s"}. You can safely exit and
                return later.
              </p>
            )}

            {draftState.phase === "error" && (
              <p className="measurement-save-status is-error" role="alert">
                {draftState.message}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              className="measurement-save-button"
              onClick={onSaveDraft}
              disabled={items.length === 0}
            >
              <BookmarkCheck className="size-4" aria-hidden="true" />
              {draftState.phase === "saved"
                ? "Quotation saved"
                : "Save quotation"}
            </Button>
          </section>

          <div className="summary-actions">
            <Button type="button" onClick={onProceed} disabled={items.length === 0}>
              Book an ocular visit
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface ExitPromptDrawerProps {
  open: boolean;
  itemCount: number;
  onOpenChange: (open: boolean) => void;
  onPointerDown: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function ExitPromptDrawer({
  open,
  itemCount,
  onOpenChange,
  onPointerDown,
  onSave,
  onDiscard,
}: ExitPromptDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="grid gap-4 ar-exit-drawer"
        data-xr-ui="true"
        onPointerDown={onPointerDown}
      >
        <DrawerHeader className="ar-drawer-header">
          <div>
            <p className="ar-drawer-eyebrow">Before you leave</p>
            <DrawerTitle>Keep your quote items?</DrawerTitle>
            <DrawerDescription>
              You have {itemCount} item{itemCount === 1 ? "" : "s"} in this AR
              session.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ar-drawer-close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </DrawerHeader>

        <div className="ar-exit-card">
          <div className="ar-exit-icon" aria-hidden="true">
            <BookmarkCheck className="size-5" />
          </div>
          <div>
            <strong>Save for later</strong>
            <p>
              Keep these AR quote items on this device and return to the main site.
            </p>
          </div>
          <div className="ar-exit-actions">
            <Button type="button" onClick={onSave}>
              Save for later
            </Button>
            <Button type="button" variant="outline" onClick={onDiscard}>
              Discard and Exit
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface ProductCatalogDrawerProps {
  open: boolean;
  detailModel: ModelDefinition | null;
  relatedModels: ModelDefinition[];
  selectedObject: V2PlacedObject | null;
  categories: ModelCategory[];
  models: ModelDefinition[];
  activeCategoryId: ModelCategoryId;
  selectedModelId: string;
  searchQuery: string;
  onOpenChange: (open: boolean) => void;
  onDetailChange: (model: ModelDefinition | null) => void;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSearchChange: (query: string) => void;
  onSelectModel: (model: ModelDefinition, fromDetail: boolean) => void;
  onChangeObjectModel: (objectId: number, model: ModelDefinition) => void;
  onPointerDown: () => void;
}

export function ProductCatalogDrawer({
  open,
  detailModel,
  relatedModels,
  selectedObject,
  categories,
  models,
  activeCategoryId,
  selectedModelId,
  searchQuery,
  onOpenChange,
  onDetailChange,
  onCategoryChange,
  onSearchChange,
  onSelectModel,
  onChangeObjectModel,
  onPointerDown,
}: ProductCatalogDrawerProps) {
  const select = (model: ModelDefinition, fromDetail: boolean) => {
    if (selectedObject) {
      onChangeObjectModel(selectedObject.id, model);
      onOpenChange(false);
      onDetailChange(null);
      return;
    }

    onSelectModel(model, fromDetail);
    onDetailChange(fromDetail ? null : model);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="grid gap-4 ar-product-drawer"
        data-xr-ui="true"
        onPointerDown={onPointerDown}
      >
        <DrawerHeader className="ar-drawer-header">
          <div>
            <p className="ar-drawer-eyebrow">AR product library</p>
            <DrawerTitle>
              {detailModel ? detailModel.label : "Discover products"}
            </DrawerTitle>
            <DrawerDescription>
              {detailModel
                ? "Review details, variants, then select it for AR."
                : "Pick the model before placing it."}
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ar-drawer-close"
            onClick={() =>
              detailModel ? onDetailChange(null) : onOpenChange(false)
            }
          >
            {detailModel ? (
              <ArrowLeft className="size-5" />
            ) : (
              <X className="size-5" />
            )}
          </Button>
        </DrawerHeader>

        {detailModel ? (
          <ArProductDrawerDetail
            model={detailModel}
            relatedModels={relatedModels}
            onSelect={(model) => select(model, true)}
            onOpenDetail={(model) => onDetailChange(model)}
          />
        ) : (
          <>
            <label className="ar-drawer-search">
              <ScanLine className="size-5" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search for product"
              />
            </label>
            <ModelCatalogPanel
              categories={categories}
              models={models}
              activeCategoryId={activeCategoryId}
              selectedModelId={selectedModelId}
              onCategoryChange={onCategoryChange}
              onSelectModel={(model) => select(model, false)}
              searchQuery={searchQuery}
              compact
              shop
            />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
