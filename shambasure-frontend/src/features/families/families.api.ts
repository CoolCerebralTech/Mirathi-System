// FILE: src/features/families/families.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type FamilyTree,
  FamilyTreeSchema,
  type Relationship,
  RelationshipSchema,
  type FamilyInvitation,
  FamilyInvitationSchema,
  type InviteMemberInput,
  type CreateRelationshipInput,
  type UpdateRelationshipInput,
  type RespondToInvitationInput,
  type InvitationQuery,
  type SuccessResponse,
  SuccessResponseSchema,
} from '../../types';
import { z } from 'zod';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  FAMILY_TREE: '/family/tree',
  RELATIONSHIPS: '/family/relationships',
  RELATIONSHIP_BY_ID: (id: string) => `/family/relationships/${id}`,
  INVITATIONS: '/family/invitations',
  RESPOND_TO_INVITATION: (id: string) => `/family/invitations/${id}/respond`,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const familyKeys = {
  all: ['family'] as const,
  tree: () => [...familyKeys.all, 'tree'] as const,
  invitations: () => [...familyKeys.all, 'invitations'] as const,
  invitationList: (filters: InvitationQuery) => [
    ...familyKeys.invitations(),
    filters,
  ] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getFamilyTree = async (): Promise<FamilyTree> => {
  const { data } = await apiClient.get(ApiEndpoints.FAMILY_TREE);
  return FamilyTreeSchema.parse(data);
};

const inviteMember = async (
  invitationData: InviteMemberInput,
): Promise<FamilyInvitation> => {
  const { data } = await apiClient.post(
    ApiEndpoints.INVITATIONS,
    invitationData,
  );
  return FamilyInvitationSchema.parse(data);
};

const getInvitations = async (
  params: InvitationQuery,
): Promise<FamilyInvitation[]> => {
  const { data } = await apiClient.get(ApiEndpoints.INVITATIONS, { params });
  return z.array(FamilyInvitationSchema).parse(data);
};

const respondToInvitation = async ({
  id,
  ...responseData
}: RespondToInvitationInput & { id: string }): Promise<SuccessResponse> => {
  const { data } = await apiClient.post(
    ApiEndpoints.RESPOND_TO_INVITATION(id),
    responseData,
  );
  return SuccessResponseSchema.parse(data);
};

const createRelationship = async (
  relationshipData: CreateRelationshipInput,
): Promise<Relationship> => {
  const { data } = await apiClient.post(
    ApiEndpoints.RELATIONSHIPS,
    relationshipData,
  );
  return RelationshipSchema.parse(data);
};

const updateRelationship = async ({
  id,
  ...updateData
}: UpdateRelationshipInput & { id: string }): Promise<Relationship> => {
  const { data } = await apiClient.patch(
    ApiEndpoints.RELATIONSHIP_BY_ID(id),
    updateData,
  );
  return RelationshipSchema.parse(data);
};

const deleteRelationship = async (id: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.RELATIONSHIP_BY_ID(id));
  return SuccessResponseSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const useFamilyTree = () =>
  useQuery({
    queryKey: familyKeys.tree(),
    queryFn: getFamilyTree,
  });

export const useInvitations = (params: InvitationQuery) =>
  useQuery({
    queryKey: familyKeys.invitationList(params),
    queryFn: () => getInvitations(params),
  });

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.invitations() });
      toast.success('Invitation sent successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondToInvitation,
    onSuccess: () => {
      // After responding, refetch both the tree and invitations
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.invitations() });
      toast.success('Invitation response submitted');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useCreateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
      toast.success('Relationship created successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useUpdateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
      toast.success('Relationship updated successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDeleteRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
      toast.success('Relationship deleted successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};