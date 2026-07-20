'use client';

import { TAG_COLORS } from '@dhanam-core/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { tagsApi, Tag as TagType, CreateTagDto, UpdateTagDto } from '@/lib/api/tags';
import { useSpaceStore } from '@/stores/space';

export default function TagsSettingsPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TagType | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<string>(TAG_COLORS[0]);

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', spaceId],
    queryFn: () => tagsApi.getTags(spaceId!),
    enabled: !!spaceId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateTagDto) => tagsApi.createTag(spaceId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', spaceId] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Tag created successfully');
    },
    onError: () => {
      toast.error('Failed to create tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ tagId, dto }: { tagId: string; dto: UpdateTagDto }) =>
      tagsApi.updateTag(spaceId!, tagId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', spaceId] });
      setEditingTag(null);
      resetForm();
      toast.success('Tag updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tag');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => tagsApi.deleteTag(spaceId!, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', spaceId] });
      setDeleteConfirm(null);
      toast.success('Tag deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete tag');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor(TAG_COLORS[0]);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (tag: TagType) => {
    setFormName(tag.name);
    setFormDescription(tag.description || '');
    setFormColor(tag.color || TAG_COLORS[0]);
    setEditingTag(tag);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      description: formDescription || undefined,
      color: formColor,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    updateMutation.mutate({
      tagId: editingTag.id,
      dto: {
        name: formName,
        description: formDescription || undefined,
        color: formColor,
      },
    });
  };

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Tag className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">Select a space to manage tags.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Create and manage tags to organize your transactions.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !tags || tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No tags yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tags help you add extra labels to transactions beyond categories.
            </p>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tags</CardTitle>
            <CardDescription>
              {tags.length} tag{tags.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color || '#64748b' }}
                    />
                    <div>
                      <p className="font-medium">{tag.name}</p>
                      {tag.description && (
                        <p className="text-sm text-muted-foreground">{tag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {tag._count.transactions} transaction
                      {tag._count.transactions !== 1 ? 's' : ''}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(tag)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogDescription>Add a new tag to organize your transactions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Tax Deductible"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tag-description">Description (optional)</Label>
                <Input
                  id="tag-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="A brief description of this tag"
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tag
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>Update the tag details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tag-name">Name</Label>
                <Input
                  id="edit-tag-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tag-description">Description (optional)</Label>
                <Input
                  id="edit-tag-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="A brief description of this tag"
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTag(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag &ldquo;{deleteConfirm?.name}&rdquo;? This will
              remove it from all transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
