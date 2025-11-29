import React, { useState } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export const FeatureFlagManager: React.FC = () => {
  const { flags, loading, isAdmin, updateFlag, addFlag, removeFlag } = useFeatureFlags();
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    rolloutPercentage: 0,
  });
  const [editingFlag, setEditingFlag] = useState<string | null>(null);

  const handleAddFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlag.name) return;

    addFlag({
      name: newFlag.name,
      description: newFlag.description,
      rolloutPercentage: newFlag.rolloutPercentage,
      users: [],
    });

    setNewFlag({ name: '', description: '', rolloutPercentage: 0 });
  };

  if (loading) {
    return <div>Loading feature flags...</div>;
  }

  if (!isAdmin) {
    return <div>You don't have permission to access this page.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Feature Flags</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Flag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFlag} className="space-y-4">
            <div>
              <Label htmlFor="flagName">Flag Name</Label>
              <Input
                id="flagName"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                placeholder="feature-name"
                required
              />
            </div>
            <div>
              <Label htmlFor="flagDescription">Description</Label>
              <Input
                id="flagDescription"
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                placeholder="What does this flag do?"
              />
            </div>
            <div>
              <Label>Rollout Percentage: {newFlag.rolloutPercentage}%</Label>
              <Slider
                value={[newFlag.rolloutPercentage]}
                onValueChange={([value]) => setNewFlag({ ...newFlag, rolloutPercentage: value })}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <Button type="submit">Add Flag</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {flags.map((flag) => (
          <Card key={flag.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{flag.name}</h3>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${flag.name}-enabled`} className="mr-4">
                        Enabled
                      </Label>
                      <Switch
                        id={`${flag.name}-enabled`}
                        checked={flag.enabled}
                        onCheckedChange={(checked) =>
                          updateFlag(flag.name, { enabled: checked })
                        }
                      />
                    </div>
                    <div className="mt-2">
                      <Label>Rollout: {flag.rolloutPercentage}%</Label>
                      <Slider
                        value={[flag.rolloutPercentage]}
                        onValueChange={([value]) =>
                          updateFlag(flag.name, { rolloutPercentage: value })
                        }
                        min={0}
                        max={100}
                        step={5}
                        disabled={!flag.enabled}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFlag(flag.name)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeatureFlagManager;
