"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Users, Repeat, Newspaper } from "lucide-react";

export function CommunityStrength() {
  const communityData = {
    resellers: 128,
    sharedFlips: 124,
    leads: 87,
  };

  return (
    <Card className="bg-[#1a2c32] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Fuerza de la Comunidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">{communityData.resellers}</p>
              <p className="text-xs text-muted-foreground -mt-1">Revenedores conectados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">{communityData.sharedFlips}</p>
              <p className="text-xs text-muted-foreground -mt-1">Flips compartidos activos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Newspaper className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">{communityData.leads}</p>
              <p className="text-xs text-muted-foreground -mt-1">Leads en la red hoy</p>
            </div>
          </div>
        </div>
        <Button className="w-full mt-4 bg-[#4caf50] hover:bg-[#4caf50]/90 text-white font-bold">
          Ver oportunidades
        </Button>
      </CardContent>
    </Card>
  );
}
