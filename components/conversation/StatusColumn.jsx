"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { fakeData } from "./fakeStatusData";
import { ExpandableSection } from "./ExpandableSection";

export function StatusColumn({ side }) {
  return (
    <div className="w-1/2 mx-auto flex justify-end">
      <Sheet key={side}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-36 bg-gray-300 text-black">
            Show Status
          </Button>
        </SheetTrigger>
        <SheetContent side={side} className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="py-6">Intense Flow</SheetTitle>
          </SheetHeader>
          {/* 動態渲染 StautsColumn */}
          <div className="grid gap-4">
            {fakeData.map((item) => (
              <Card key={item.id} className="w-full">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(item.content).map(([key, value]) =>
                      typeof value === "object" && value !== null ? (
                        <ExpandableSection key={key} title={key} data={value} />
                      ) : (
                        <p key={key} className="text-gray-700">
                          <span className="font-medium">{key}:</span>{" "}
                          {value.toString()}
                        </p>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
