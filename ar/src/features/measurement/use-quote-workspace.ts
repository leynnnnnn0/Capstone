import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelDefinition } from "./model-catalog";
import { defaultV2DimensionsForModel } from "./placement-helpers";
import {
  estimateQuotePrice,
  formatQuoteDimensions,
  objectToQuoteTransferItem,
  readSavedArQuoteItems,
  transferItemToSummaryQuoteItem,
  v2ObjectToQuoteTransferItem,
} from "./quote-handoff";
import type { MeasuredObject } from "./types";
import type {
  ArQuoteTransferPayload,
  ArQuoteTransferItem,
  FlowVersion,
  QuoteDraftSaveState,
  SummaryQuoteItem,
  V2PlacedObject,
} from "./workspace-types";
import { SAVED_AR_QUOTE_KEY } from "./workspace-types";

interface QuoteWorkspaceOptions {
  flowVersion: FlowVersion;
  objects: MeasuredObject[];
  placementObjects: V2PlacedObject[];
  findModel: (modelId: string) => ModelDefinition;
  onStatus: (message: string) => void;
}

export function useQuoteWorkspace({
  flowVersion,
  objects,
  placementObjects,
  findModel,
  onStatus,
}: QuoteWorkspaceOptions) {
  const [manualItems, setManualItems] = useState<ArQuoteTransferItem[]>([]);
  const [draftState, setDraftState] = useState<QuoteDraftSaveState>({
    phase: "idle",
  });
  const isPlacementFlow = flowVersion === "v2" || flowVersion === "v3";

  useEffect(() => {
    const savedItems = readSavedArQuoteItems();
    if (savedItems.length > 0) setManualItems(savedItems);
  }, []);

  const measuredItems = useMemo<SummaryQuoteItem[]>(() => {
    const toSummary = (
      id: number,
      model: ModelDefinition,
      widthCm: number,
      heightCm: number,
    ): SummaryQuoteItem => ({
      id,
      label: model.label,
      description: model.description,
      dimensionsText: formatQuoteDimensions(widthCm, heightCm),
      price: estimateQuotePrice(widthCm, heightCm, model),
    });

    if (isPlacementFlow) {
      return placementObjects.map((object) =>
        toSummary(
          object.id,
          findModel(object.modelId),
          object.dimensions.segmentsCm[0] ?? 0,
          object.dimensions.heightCm,
        ),
      );
    }

    return objects.map((object) =>
      toSummary(
        object.id,
        findModel(object.modelId),
        object.dimensions.segmentsCm.reduce((sum, segment) => sum + segment, 0),
        object.dimensions.heightCm,
      ),
    );
  }, [findModel, isPlacementFlow, objects, placementObjects]);

  const summaryItems = useMemo(
    () => [
      ...manualItems.map((item, index) =>
        transferItemToSummaryQuoteItem(item, index),
      ),
      ...measuredItems,
    ],
    [manualItems, measuredItems],
  );
  const estimatedTotal = useMemo(
    () =>
      summaryItems.reduce(
        (total, item) => total + (item.price == null ? 0 : item.price),
        0,
      ),
    [summaryItems],
  );

  const addModel = useCallback(
    (model: ModelDefinition) => {
      if (!model.productId) {
        onStatus("Choose an uploaded product before adding it to quote.");
        return;
      }

      const dimensions = defaultV2DimensionsForModel(model);
      const widthCm = dimensions.segmentsCm[0] ?? 0;
      setManualItems((items) => [
        ...items,
        {
          productId: model.productId!,
          modelId: model.id,
          label: model.label,
          description: model.description,
          segmentsCm: dimensions.segmentsCm,
          widthCm,
          heightCm: dimensions.heightCm,
          price: estimateQuotePrice(widthCm, dimensions.heightCm, model),
        },
      ]);
      onStatus(`${model.label} added to quote.`);
    },
    [onStatus],
  );

  const transferItems = useCallback(() => {
    if (isPlacementFlow) {
      return [
        ...manualItems,
        ...placementObjects
          .map((object) =>
            v2ObjectToQuoteTransferItem(object, findModel(object.modelId)),
          )
          .filter((item): item is ArQuoteTransferItem => Boolean(item)),
      ];
    }

    return objects
      .map((object) =>
        objectToQuoteTransferItem(object, findModel(object.modelId)),
      )
      .filter((item): item is ArQuoteTransferItem => Boolean(item));
  }, [findModel, isPlacementFlow, manualItems, objects, placementObjects]);

  useEffect(() => {
    setDraftState({ phase: "idle" });
  }, [manualItems, objects, placementObjects]);

  const saveDraft = useCallback(() => {
    const items = transferItems();
    if (items.length === 0) {
      setDraftState({
        phase: "error",
        message: "Add or capture at least one item before saving.",
      });
      return false;
    }

    try {
      localStorage.setItem(
        SAVED_AR_QUOTE_KEY,
        JSON.stringify({
          source: "sog-ar",
          version: 1,
          createdAt: new Date().toISOString(),
          items,
        } satisfies ArQuoteTransferPayload),
      );
      setDraftState({ phase: "saved", itemCount: items.length });
      return true;
    } catch {
      setDraftState({
        phase: "error",
        message: "This device could not save the quotation draft.",
      });
      return false;
    }
  }, [transferItems]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(SAVED_AR_QUOTE_KEY);
    } catch {
      // The in-memory draft can still be cleared when storage is unavailable.
    }
    setManualItems([]);
    setDraftState({ phase: "idle" });
  }, []);

  return {
    summaryItems,
    estimatedTotal,
    addModel,
    transferItems,
    draftState,
    saveDraft,
    clearDraft,
  };
}
