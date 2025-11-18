import * as vscode from 'vscode';
import { TemplateService } from '../templateService';

interface CostEstimatorInput {
    serviceName?: string;
    currencyCode?: string;
    priceType?: string;
    armRegionName?: string;
    sku?: string;
}

interface AzureRetailPriceItem {
    currencyCode: string;
    tierMinimumUnits: number;
    retailPrice: number;
    unitPrice: number;
    armRegionName: string;
    location: string;
    effectiveStartDate: string;
    meterId: string;
    meterName: string;
    productId: string;
    skuId: string;
    productName: string;
    skuName: string;
    serviceName: string;
    serviceId: string;
    serviceFamily: string;
    unitOfMeasure: string;
    type: string;
    isPrimaryMeterRegion: boolean;
    armSkuName: string;
    reservationTerm?: string;
    savingsPlan?: Array<{
        unitPrice: number;
        retailPrice: number;
        term: string;
    }>;
}

interface AzureRetailPriceResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    BillingCurrency?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CustomerEntityId?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CustomerEntityType?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Items: AzureRetailPriceItem[];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    NextPageLink: string | null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Count: number;
}

export class CostEstimatorTool implements vscode.LanguageModelTool<CostEstimatorInput> {
    
    constructor(private templateService: TemplateService, private extensionUri: vscode.Uri) {}

    async prepareInvocation(
        _options: vscode.LanguageModelToolInvocationPrepareOptions<CostEstimatorInput>,
        _token: vscode.CancellationToken
    ) {
        return {
            invocationMessage: 'Estimating Azure Costs'
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<CostEstimatorInput>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const input = options.input || {};
            const serviceName = input.serviceName || '';
            const currencyCode = input.currencyCode || 'USD';
            const priceType = input.priceType || 'Consumption';
            const armRegionName = input.armRegionName || '';
            const sku = input.sku || '';

            // Build filter query for Azure Retail Prices API
            const filters: string[] = [];
            
            if (serviceName) {
                filters.push(`serviceName eq '${serviceName}'`);
            }
            if (priceType) {
                filters.push(`priceType eq '${priceType}'`);
            }
            if (armRegionName) {
                filters.push(`armRegionName eq '${armRegionName}'`);
            }
            if (sku) {
                filters.push(`skuName eq '${sku}'`);
            }

            const filterString = filters.length > 0 ? filters.join(' and ') : '';
            
            // Construct API URL
            const baseUrl = 'https://prices.azure.com/api/retail/prices';
            const apiVersion = '2023-01-01-preview';
            let apiUrl = `${baseUrl}?api-version=${apiVersion}`;
            
            if (currencyCode !== 'USD') {
                apiUrl += `&currencyCode='${currencyCode}'`;
            }
            
            if (filterString) {
                apiUrl += `&$filter=${encodeURIComponent(filterString)}`;
            }

            // Fetch pricing data
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Azure Retail Prices API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as AzureRetailPriceResponse;
            
            // Format response as JSON
            const responsePayload = {
                count: data.Count || 0,
                currencyCode: currencyCode,
                nextPageLink: data.NextPageLink || null,
                items: (data.Items || []).slice(0, 50).map((item: any) => ({
                    serviceName: item.serviceName,
                    serviceFamily: item.serviceFamily,
                    productName: item.productName,
                    skuName: item.skuName,
                    meterName: item.meterName,
                    armRegionName: item.armRegionName,
                    location: item.location,
                    retailPrice: item.retailPrice,
                    unitPrice: item.unitPrice,
                    unitOfMeasure: item.unitOfMeasure,
                    type: item.type,
                    currencyCode: item.currencyCode,
                    effectiveStartDate: item.effectiveStartDate,
                    armSkuName: item.armSkuName,
                    savingsPlan: item.savingsPlan || null
                })),
                truncated: (data.Items || []).length > 50
            };

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(responsePayload, null, 2))
            ]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error estimating costs: ${errorMessage}`)
            ]);
        }
    }
}