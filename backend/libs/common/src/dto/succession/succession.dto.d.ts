import { WillStatus, AssetType, RelationshipType } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { UserResponseDto } from '../users/user.dto';
export declare class CreateWillRequestDto {
    title: string;
    status?: "DRAFT" | undefined;
}
export declare class UpdateAssetRequestDto {
    name?: string;
    description?: string;
}
export declare class UpdateWillRequestDto {
    title?: string;
    status?: WillStatus;
}
export declare class CreateAssetRequestDto {
    name: string;
    description?: string;
    type: AssetType;
}
export declare class AssignBeneficiaryRequestDto {
    assetId: string;
    beneficiaryId: string;
    sharePercent?: number;
}
export declare class CreateFamilyRequestDto {
    name: string;
}
export declare class AddFamilyMemberRequestDto {
    userId: string;
    role: RelationshipType;
}
export declare class AssetResponseDto extends BaseResponseDto {
    name: string;
    description?: string;
    type: AssetType;
    ownerId: string;
}
export declare class BeneficiaryAssignmentResponseDto extends BaseResponseDto {
    willId: string;
    assetId: string;
    beneficiaryId: string;
    sharePercent?: number;
    asset: AssetResponseDto;
    beneficiary: UserResponseDto;
}
export declare class WillResponseDto extends BaseResponseDto {
    title: string;
    status: WillStatus;
    testatorId: string;
    beneficiaryAssignments: BeneficiaryAssignmentResponseDto[];
}
export declare class FamilyMemberResponseDto {
    userId: string;
    role: RelationshipType;
    user: UserResponseDto;
}
export declare class FamilyResponseDto extends BaseResponseDto {
    name: string;
    creatorId: string;
    members: FamilyMemberResponseDto[];
}
//# sourceMappingURL=succession.dto.d.ts.map